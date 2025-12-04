import { useState } from "react";

export default function ContractForm() {
  const [contractorName, setContractorName] = useState("");
  const [email, setEmail] = useState("");
  const [payRate, setPayRate] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
    const res = await fetch(`${apiUrl}/api/generate-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractorName, email, payRate: Number(payRate) }),
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    // Open PDF in a new tab
    window.open(url, "_blank");
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h2>Create Contract</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Contractor Name:</label>
          <input
            type="text"
            value={contractorName}
            onChange={(e) => setContractorName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Pay per Day ($):</label>
          <input
            type="number"
            value={payRate}
            onChange={(e) => setPayRate(e.target.value)}
            required
          />
        </div>
        {payRate && (
          <div>
            <label>Pay per Half-Day: </label>
            <span>${(payRate / 2).toFixed(2)}</span>
          </div>
        )}
        <div style={{ marginTop: 20 }}>
          <button type="submit">Generate PDF</button>
        </div>
      </form>
    </div>
  );
}
