import type { NextPage } from 'next'
import Editor from "./components/editor"
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AritifyAI',
};

const Dashboard: NextPage = () => {
  return (
    <Editor/>
  );
}
export default Dashboard