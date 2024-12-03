import React from "react";
import DropContainer from "./components/DropContainer";

function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Key-Value Pair Extractor with Drag-and-Drop</h1>
      <p>
        To extract key-value pairs or raw text from any web page, follow these steps:
      </p>
      <ol>
        <li>
          Open any web page with content you want to extract (e.g., a form with labels and inputs).
        </li>
        <li>Select the desired content by highlighting it with your mouse.</li>
        <li>Drag the selected content into the drop area below.</li>
        <li>View the extracted key-value pairs or raw text in the drop container.</li>
      </ol>
      <DropContainer />
    </div>
  );
}

export default App;

