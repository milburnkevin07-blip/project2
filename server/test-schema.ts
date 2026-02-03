import "dotenv/config";

async function testSchema() {
  console.log("Testing schema imports...");
  
  const schema = await import("../shared/schema");
  console.log("Schema keys:", Object.keys(schema));
  console.log("jobNotes:", schema.jobNotes);
  console.log("users:", schema.users);
}

testSchema();