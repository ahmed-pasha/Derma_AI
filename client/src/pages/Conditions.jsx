import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Conditions() {
  const [diseases, setDiseases] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/diseases").then(({ data }) => setDiseases(data.diseases)).catch(() => setError("Unable to load condition information."));
  }, []);

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">Skin Conditions</span>
          <h2>Learn About Skin Conditions</h2>
          <p>Educational information about conditions DermaAI can help assess. Not a substitute for professional diagnosis.</p>
        </div>

        {diseases === null && !error && <LoadingSpinner />}
        {error && <p className="error-text">{error}</p>}

        <div className="grid grid-3">
          {diseases?.map((d) => (
            <Link key={d.slug} to={`/conditions/${d.slug}`} className="card card-pad">
              <h4>{d.name}</h4>
              <p style={{ marginBottom: 0, fontSize: "0.9rem" }}>{d.description.slice(0, 110)}...</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
