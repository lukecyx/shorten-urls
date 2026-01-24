export async function handler(event: any): Promise<any> {
  console.log("create url handler called");
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "create url handler called" }),
  };
}
