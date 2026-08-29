import { useState } from "react";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const submit = (e) => {
    e.preventDefault();
    // No backend email service is wired up in this scaffold; this simply
    // acknowledges the submission locally rather than pretending to send it.
    setSent(true);
  };

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 640 }}>
        <div className="section-header">
          <span className="eyebrow">Contact</span>
          <h2>Get in Touch</h2>
        </div>

        <div className="grid grid-2">
          <div className="card card-pad">
            <h4>Project Team</h4>
            <p style={{ marginBottom: 4 }}>DermaAI — Final-Year Academic Project</p>
            <p style={{ marginBottom: 4 }}>Email: team@example.com</p>
            <p style={{ marginBottom: 4 }}>Phone: +91 00000 00000 (placeholder)</p>
            <p style={{ marginBottom: 0 }}>Institution: [Your College/University Name]</p>
          </div>

          <form className="card card-pad" onSubmit={submit}>
            {sent ? (
              <p style={{ marginBottom: 0 }}>Thanks — your message has been noted. (This form is a UI demo; wire it to an email service to go live.)</p>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="cname">Name</label>
                  <input id="cname" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="cemail">Email</label>
                  <input id="cemail" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="cmessage">Message</label>
                  <textarea id="cmessage" rows={4} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </div>
                <button className="btn btn-primary btn-block">Send Message</button>
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
