import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const graphqlUri = apiBase ? `${apiBase}/graphql` : "/graphql";

const httpLink = new HttpLink({
  uri: graphqlUri
});

const authLink = setContext((_, { headers }) => {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("authToken") : null;
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});
