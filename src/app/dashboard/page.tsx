// import { client } from "@/graphql/client";
// import { getCreatedIssuesQuery } from "@/graphql/queries";

import { Card, CardColumn } from "@/components";

export default async function DashboardPage() {
  // const result = await client.query({ query: getCreatedIssuesQuery });

  return (
    <>
      <CardColumn>
        <Card />
      </CardColumn>
    </>
  );
}
