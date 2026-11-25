// All DynamoDB access lives here. createDynamoStore takes the SDK client and command classes as
// arguments, so the tests can check the exact requests without AWS or the SDK installed.
const INDEX = "ReviewsByStatus";
const COUNTER_ID = "COUNTER#visits";
const conditionFailed = (err) => err?.name === "ConditionalCheckFailedException";

export function createDynamoStore({ client, cmd, table }) {
  const send = (command) => client.send(command);
  const byStatus = (status, extra) => new cmd.QueryCommand({
    TableName: table,
    IndexName: INDEX,
    KeyConditionExpression: "#s = :s",
    ExpressionAttributeNames: { "#s": "status" }, // "status" is a DynamoDB reserved word
    ExpressionAttributeValues: { ":s": status },
    ...extra,
  });

  return {
    async putReview(item) {
      await send(new cmd.PutCommand({ TableName: table, Item: item, ConditionExpression: "attribute_not_exists(id)" }));
    },
    async countByStatus(status, limit) {
      const out = await send(byStatus(status, { Select: "COUNT", Limit: limit }));
      return out.Count ?? 0;
    },
    async listByStatus(status, limit) {
      const out = await send(byStatus(status, { ScanIndexForward: false, Limit: limit })); // newest first
      return out.Items ?? [];
    },
    // Approving also removes expiresAt, so the DynamoDB TTL no longer deletes the review.
    async approve(id, approvedAt) {
      try {
        await send(new cmd.UpdateCommand({
          TableName: table,
          Key: { id },
          UpdateExpression: "SET #s = :approved, approvedAt = :at REMOVE expiresAt",
          ConditionExpression: "attribute_exists(id) AND #s = :pending",
          ExpressionAttributeNames: { "#s": "status" },
          ExpressionAttributeValues: { ":approved": "approved", ":pending": "pending", ":at": approvedAt },
        }));
        return true;
      } catch (err) { if (conditionFailed(err)) return false; throw err; }
    },
    async reject(id) {
      try {
        await send(new cmd.DeleteCommand({
          TableName: table,
          Key: { id },
          ConditionExpression: "#s = :pending",
          ExpressionAttributeNames: { "#s": "status" },
          ExpressionAttributeValues: { ":pending": "pending" },
        }));
        return true;
      } catch (err) { if (conditionFailed(err)) return false; throw err; }
    },
    async remove(id) {
      try {
        await send(new cmd.DeleteCommand({ TableName: table, Key: { id }, ConditionExpression: "attribute_exists(id)" }));
        return true;
      } catch (err) { if (conditionFailed(err)) return false; throw err; }
    },
    async incrementVisits() {
      const out = await send(new cmd.UpdateCommand({
        TableName: table,
        Key: { id: COUNTER_ID },
        UpdateExpression: "ADD #v :one", // ADD creates the attribute on the first hit
        ExpressionAttributeNames: { "#v": "visits" },
        ExpressionAttributeValues: { ":one": 1 },
        ReturnValues: "UPDATED_NEW",
      }));
      return Number(out.Attributes.visits);
    },
    async getVisits() {
      const out = await send(new cmd.GetCommand({ TableName: table, Key: { id: COUNTER_ID } }));
      return Number(out.Item?.visits ?? 0);
    },
  };
}

// The AWS SDK v3 ships inside the Lambda Node runtime, so it is imported only when a real
// request needs it. Nothing is bundled and the unit tests never load it.
async function realStore(table = process.env.TABLE_NAME) {
  const [{ DynamoDBClient }, lib] = await Promise.all([
    import("@aws-sdk/client-dynamodb"),
    import("@aws-sdk/lib-dynamodb"),
  ]);
  const client = lib.DynamoDBDocumentClient.from(new DynamoDBClient({}), { marshallOptions: { removeUndefinedValues: true } });
  return createDynamoStore({ client, cmd: lib, table });
}

let cached;
export const defaultStore = () => (cached ??= realStore().catch((err) => { cached = undefined; throw err; }));
