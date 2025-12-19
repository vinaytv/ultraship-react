import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const resolveApiBase = () => {
  const envBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  if (envBase) return envBase;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:8080";
    }
  }
  return "";
};

const apiBase = resolveApiBase();
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
