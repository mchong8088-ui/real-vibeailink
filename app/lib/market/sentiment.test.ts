// Test file for sentiment analysis
// Run with: npx ts-node app/lib/market/sentiment.test.ts

import { getSentiment, analyzeTextSentiment } from './sentiment';

const testNews = [
  { title: "Tesla stock surges to all-time high on strong delivery numbers" },
  { title: "Company reports record profit, beating analyst estimates" },
  { title: "Analyst upgrades Tesla to Buy, cites AI leadership" },
  { title: "Market concerns about competition from China" },
  { title: "Regulatory investigation announced, stock dips slightly" },
];

console.log("Testing sentiment analysis...");
const result = getSentiment(testNews);
console.log("Result:", result);

console.log("\nTesting single text:");
console.log(analyzeTextSentiment("Great news! Profits are up 50%"));
console.log(analyzeTextSentiment("Warning: Sales are declining rapidly"));
