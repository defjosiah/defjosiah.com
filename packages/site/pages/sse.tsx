import * as React from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import { useState, useEffect } from "react";

const RedirectsPage: React.FunctionComponent = () => {
  const [stream, setStream] = useState([]);
  useEffect(() => {
    const source = new EventSource(`https://defjosiah.com/api/sse`);
    source.onopen = e => {
      console.error(e);
    };
    console.log(source);
    // @ts-ignore
    source.onmessage = (e, ev) => {
      console.log(e);
      console.log(ev);
      // @ts-ignore
      setStream(stream.concat[ev]);
    };
    // @ts-ignore
    source.onerror = e => {
      console.error(e);
    };
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
      <h2>Server-Sent events</h2>
      {stream.map((x, i) => (
        <div key={i}>{x}</div>
      ))}
    </Layout>
  );
};

export default RedirectsPage;
