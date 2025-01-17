import { gql } from "@/__generated__";
import { auth } from "@/auth"
import { client } from "@/graphql/client";
import { redirect } from "next/navigation";

const findFirst20IssuesQuery = gql(`
  query GetMostRecentIssues($owner: String!, $name: String!) {
    repository(owner:$owner, name:$name) {
      issues(last:20, states:CLOSED) {
        edges {
          node {
            title
            url
            labels(first:5) {
              edges {
                node {
                  name
                }
              }
            }
          }
        }
      }
    }    
  }
`);

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user || session.error === "RefreshTokenError") redirect("/sign-in");

  const result = await client.query({
    query: findFirst20IssuesQuery,
    variables: {
      owner: "uwpokerclub",
      name: "app"
    }
  });

  console.log(result.data.repository?.issues.edges)

  return (
    <div>
      <h1>Dashboard page</h1>

      <p>Hello {session.user.name}</p>

      {result.data.repository?.issues.edges?.map((issue) => (
        <p key={issue?.node?.url}>{issue?.node?.title || "No Results"}</p>
      )) || <p>No Results</p>}
    </div>
  )
}