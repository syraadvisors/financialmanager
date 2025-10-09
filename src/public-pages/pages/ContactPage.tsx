import React, { useState } from 'react';
import MarketingLayout from '../components/MarketingLayout';
import '../styles/marketing.css';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: '',
    newsletter: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you for contacting us! We will get back to you soon.');
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      subject: '',
      message: '',
      newsletter: false,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <MarketingLayout>
      <div className="page-header">
        <h1>Get in Touch</h1>
        <p>We're here to help. Reach out to us with any questions or concerns.</p>
      </div>

      <div className="contact-container">
        <div className="contact-info">
          <h2>Contact Information</h2>
          <div className="info-item">
            <h3>Address</h3>
            <p>
              123 Business St
              <br />
              City, State, Zip
            </p>
          </div>
          <div className="info-item">
            <h3>Phone</h3>
            <p>
              <a href="tel:+11234567890">(123) 456-7890</a>
            </p>
          </div>
          <div className="info-item">
            <h3>Email</h3>
            <p>
              <a href="mailto:support@feemgr.com">support@feemgr.com</a>
            </p>
          </div>
          <div className="info-item">
            <h3>Business Hours</h3>
            <p>
              Monday - Friday: 9am - 5pm EST
              <br />
              Saturday - Sunday: Closed
            </p>
          </div>
        </div>

        <div className="contact-form">
          <h2>Send Us a Message</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(123) 456-7890"
              />
            </div>

            <div className="form-group">
              <label htmlFor="company">Company Name</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Your Company"
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <select
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
              >
                <option value="">Select a subject</option>
                <option value="general">General Inquiry</option>
                <option value="sales">Sales</option>
                <option value="support">Technical Support</option>
                <option value="billing">Billing Question</option>
                <option value="partnership">Partnership Opportunity</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                name="message"
                required
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us how we can help..."
              />
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="newsletter"
                name="newsletter"
                checked={formData.newsletter}
                onChange={handleChange}
              />
              <label htmlFor="newsletter">
                Subscribe to our newsletter for product updates and tips
              </label>
            </div>

            <button type="submit" className="button primary-button" style={{ width: '100%' }}>
              Send Message
            </button>
          </form>
        </div>
      </div>
    </MarketingLayout>
  );
};

export default ContactPage;
