import zainab from "../assets/team/zaina.jpeg";
import sahana from "../assets/team/Sahana.jpeg";
import srujan from "../assets/team/Surjan.jpeg";
import mem4 from "../assets/team/seema.jpeg";

const members = [
  {
    name: "Zainab Fathima",
    role: "ML Engineer",
    image: zainab,
    contribution:
      "Worked on the machine learning system for DermaAI, including dataset preparation, model training, evaluation, and improving the skin disease classification model.",
  },
  {
    name: "Sahana Pujari",
    role: "Frontend Designer",
    image: sahana,
    contribution:
      "Designed and developed the frontend user experience for DermaAI, including application pages, user interface components, navigation, and the presentation of prediction results.",
  },
  {
    name: "Srujan AB",
    role: "Tester",
    image: srujan,
    contribution:
      "Tested the DermaAI application, identified bugs and usability issues, verified features, and helped ensure that the application functions correctly.",
  },
  {
  name: "Seema Kumari",
  role: "Backend Designer",
  image: mem4,
  contribution:
    "Designed and contributed to the backend architecture of DermaAI,server-side functionality,and communication between the frontend and ML services.",
},
];

export default function Team() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-header" style={{ textAlign: "center", marginBottom: 48 }}>
          <span className="eyebrow">Our Team</span>
          <h2>Meet Our Team</h2>
          <p style={{ color: "var(--text-muted)", maxWidth: 600, margin: "12px auto 0", lineHeight: 1.7 }}>
            Meet the people behind DermaAI and the technology powering our skin disease classification platform.
          </p>
        </div>

        <div className="team-grid">
          {members.map((m) => (
            <div className="team-card" key={m.name}>
              <div className="team-card-img-wrap">
                <img src={m.image} alt={m.name} className="team-card-img" />
              </div>
              <div className="team-card-body">
                <h3 className="team-card-name">{m.name}</h3>
                <span className="team-card-role">{m.role}</span>
                <p className="team-card-contrib">{m.contribution}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
