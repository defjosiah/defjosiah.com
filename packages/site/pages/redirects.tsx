import * as React from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";

const fetcher = (url: string) => {
  return fetch(url).then(r => r.json());
};

const existsOrUndefinedFetcher = (url: string, key: string) => {
  console.log(url, key);
  return fetch(url + key).then(res => {
    if (res.status === 404) {
      return { from: key, to: null };
    } else {
      return res.json();
    }
  });
};
const multiFetcher = (
  url: string,
  ...deps: Array<string>
): Promise<Array<{ from: string; to: string | null }>> => {
  console.log("multifetch", url, deps);
  return Promise.all(deps.map(key => existsOrUndefinedFetcher(url, key)));
};
const RedirectsPage: React.FunctionComponent = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isPending, setIsPending] = useState(false);

  const { data: redirectsFrom = [] } = useSWR<Array<string>>(
    `${process.env.API_BASE}/redirect`,
    fetcher,
    { refreshInterval: 3000 }
  );
  const fetchDeps = useMemo(
    () => [`${process.env.API_BASE}/redirect`, ...redirectsFrom],
    [redirectsFrom]
  );
  const { data: redirectsTo = [] } = useSWR<
    Array<{ from: string; to: string | null }>
  >(fetchDeps, multiFetcher);

  useEffect(() => {
    if (!isPending) {
      return;
    }
    if (redirectsTo.find(({ from: redirectFrom }) => redirectFrom === from)) {
      setIsPending(false);
      setFrom("");
      setTo("");
    }
  }, [redirectsTo]);

  const addNewRedirect = async () => {
    setIsPending(true);
    await fetch(`${process.env.API_BASE}/redirect${from}`, {
      headers: { Accept: "application/json" },
      method: "POST",
      body: JSON.stringify({ to })
    });
  };
  return (
    <Layout title="Redirects | Next.js + TypeScript Example">
      <h1>Redirects</h1>
      <p>This is the redirects page for defjosiah.com</p>
      <p>
        <Link href="/">
          <a>Go home</a>
        </Link>
      </p>
      <h2>Add new redirect</h2>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div>
          <p>From</p>
          <input
            disabled={isPending}
            value={from}
            onChange={e => setFrom(e.target.value)}
          ></input>
        </div>
        <div>
          <p>To</p>
          <input
            disabled={isPending}
            value={to}
            onChange={e => setTo(e.target.value)}
          ></input>
        </div>
      </div>
      {isPending && <div>Making it live! This might take up to 15 seconds</div>}
      <button
        disabled={from.length === 0 || to.length === 0 || isPending}
        onClick={addNewRedirect}
      >
        Add New Redirect
      </button>
      <h2>Redirects list</h2>
      {Array.from(new Set(redirectsTo)).map(({ from, to }) => (
        <div key={from + (to || "none")}>{`${from} - ${to ||
          "not ready"}`}</div>
      ))}
    </Layout>
  );
};

export default RedirectsPage;
