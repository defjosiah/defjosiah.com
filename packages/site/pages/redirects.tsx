import * as React from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import { useEffect, useState } from "react";
// import useSWR from "swr";

const AboutPage: React.FunctionComponent = () => {
  const [redirects, setRedirects] = useState<Array<[string, string]>>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  // const
  const fetchRedirects = async () => {
    const allRedirects = await fetch(`${process.env.API_BASE}/redirect`, {
      headers: { Accept: "application/json" }
    }).then(res => res.json());
    setRedirects(allRedirects);
  };
  const updateFromAndTo = async () => {
    await fetch(`${process.env.API_BASE}/redirect`, {
      headers: { Accept: "application/json" },
      method: "POST",
      body: JSON.stringify([{ from, to }])
    }).then(res => res.json());
    setRedirects(redirects.concat([[from, to]]));
    setFrom("");
    setTo("");
  };
  useEffect(() => {
    fetchRedirects();
  }, []);
  return (
    <Layout title="Redirects | Next.js + TypeScript Example">
      <h1>Redirects</h1>
      <p>This is the redirects page for defjosiah.com</p>
      <p>
        <Link href="/">
          <a>Go home</a>
        </Link>
      </p>
      {redirects.map(p => (
        <div key={p[0]}>{`${p[0]}-${p[1]}`}</div>
      ))}
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div>
          <p>From</p>
          <input value={from} onChange={e => setFrom(e.target.value)}></input>
        </div>
        <div>
          <p>To</p>
          <input value={to} onChange={e => setTo(e.target.value)}></input>
        </div>
      </div>
      <button
        disabled={from.length === 0 || to.length === 0}
        onClick={updateFromAndTo}
      >
        Add New Redirect
      </button>
    </Layout>
  );
};

export default AboutPage;
