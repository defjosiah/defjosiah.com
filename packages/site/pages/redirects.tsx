import * as React from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import { useEffect, useState } from "react";

const AboutPage: React.FunctionComponent = () => {
  const [redirects, setRedirects] = useState([]);
  useEffect(() => {
    const fetchRedirects = async () => {
      const allRedirects = await fetch("/api/redirect", {
        headers: { Accept: "application/json" }
      }).then(res => res.json());
      setRedirects(allRedirects);
    };
    fetchRedirects();
  }, []);
  return (
    <Layout title="About | Next.js + TypeScript Example">
      <h1>About</h1>
      <p>This is the about page for josiah</p>
      <p>
        <Link href="/">
          <a>Go home</a>
        </Link>
        {redirects.map(p => (
          <div key={p[0]}>{`${p[0]}-${p[1]}`}</div>
        ))}
      </p>
    </Layout>
  );
};

export default AboutPage;
