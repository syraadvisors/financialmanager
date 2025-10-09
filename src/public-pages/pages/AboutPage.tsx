import React from 'react';
import MarketingLayout from '../components/MarketingLayout';
import '../styles/marketing.css';

const AboutPage: React.FC = () => {
  return (
    <MarketingLayout>
      <div className="page-header">
        <h1>About FeeMGR</h1>
        <p>
          Our mission is to simplify fee management for financial advisors through
          innovative technology and exceptional service.
        </p>
      </div>

      <div className="content-section">
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--primary)' }}>
            Our Story
          </h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
            FeeMGR was founded in 2020 by a team of financial professionals and
            software engineers who recognized the need for a modern, automated fee
            management solution. Our goal is to help financial advisors streamline
            their billing processes, ensure compliance, and enhance client
            relationships.
          </p>
          <p style={{ color: 'var(--text-light)' }}>
            Since our inception, we have grown rapidly, serving hundreds of financial
            advisors across the country. Our platform is designed to be user-friendly,
            secure, and scalable, making it the ideal choice for firms of all sizes.
            We are committed to continuous improvement and regularly update our
            software based on user feedback and industry trends.
          </p>
        </div>

        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--primary)' }}>
            Our Values
          </h2>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            <li style={{
              marginBottom: '0.5rem',
              color: 'var(--text-light)',
              display: 'flex',
              alignItems: 'flex-start'
            }}>
              <span style={{
                color: 'var(--primary)',
                fontWeight: 'bold',
                marginRight: '0.5rem'
              }}>
                ✓
              </span>
              <span>
                <strong>Innovation:</strong> We continuously develop new features and
                integrations to meet the evolving needs of our users.
              </span>
            </li>
            <li style={{
              marginBottom: '0.5rem',
              color: 'var(--text-light)',
              display: 'flex',
              alignItems: 'flex-start'
            }}>
              <span style={{
                color: 'var(--primary)',
                fontWeight: 'bold',
                marginRight: '0.5rem'
              }}>
                ✓
              </span>
              <span>
                <strong>Integrity:</strong> We prioritize transparency and honesty in
                all our interactions and business practices.
              </span>
            </li>
            <li style={{
              marginBottom: '0.5rem',
              color: 'var(--text-light)',
              display: 'flex',
              alignItems: 'flex-start'
            }}>
              <span style={{
                color: 'var(--primary)',
                fontWeight: 'bold',
                marginRight: '0.5rem'
              }}>
                ✓
              </span>
              <span>
                <strong>Customer Focus:</strong> Our users are at the heart of
                everything we do. We strive to provide exceptional support and service.
              </span>
            </li>
            <li style={{
              marginBottom: '0.5rem',
              color: 'var(--text-light)',
              display: 'flex',
              alignItems: 'flex-start'
            }}>
              <span style={{
                color: 'var(--primary)',
                fontWeight: 'bold',
                marginRight: '0.5rem'
              }}>
                ✓
              </span>
              <span>
                <strong>Compliance:</strong> We ensure our software meets regulatory
                requirements to help advisors stay compliant.
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--primary)' }}>
            Meet the Team
          </h2>
          <div className="team-grid">
            <div className="team-member">
              <img
                src="/images/team-placeholder.jpg"
                alt="Kellen Leone"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23ddd" width="150" height="150"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EKL%3C/text%3E%3C/svg%3E';
                }}
              />
              <h3>Kellen Leone</h3>
              <p className="credentials">MBA, EA</p>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>CEO & Founder</p>
              <p>
                Kellen has over 15 years of experience in the financial industry and is
                passionate about leveraging technology to solve complex problems. Under
                his leadership, FeeMGR has become a trusted partner for financial
                advisors. Kellen holds a master's degree in Business Administration, as
                well as bachelor's degrees in Accounting and Information Technology. He
                is a credentialed Enrolled Agent and holds multiple I.T. certifications
                including CompTIA A+, Network+, and Security+.
              </p>
            </div>

            <div className="team-member">
              <img
                src="/images/team-placeholder.jpg"
                alt="John Smith"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23ddd" width="150" height="150"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EJS%3C/text%3E%3C/svg%3E';
                }}
              />
              <h3>John Smith</h3>
              <p className="credentials">PhD in Computer Science</p>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>CTO & Co-Founder</p>
              <p>
                John is a seasoned software engineer with a background in developing
                enterprise-level applications. He oversees the technical direction of
                FeeMGR, ensuring our platform remains cutting-edge and reliable.
              </p>
            </div>

            <div className="team-member">
              <img
                src="/images/team-placeholder.jpg"
                alt="Emily Johnson"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23ddd" width="150" height="150"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EEJ%3C/text%3E%3C/svg%3E';
                }}
              />
              <h3>Emily Johnson</h3>
              <p className="credentials">Certified Customer Success Manager (CCSM)</p>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                Head of Customer Success
              </p>
              <p>
                Emily leads our customer success team, dedicated to providing
                exceptional support and ensuring our users get the most out of our
                platform. She has a knack for understanding client needs and delivering
                tailored solutions.
              </p>
            </div>

            <div className="team-member">
              <img
                src="/images/team-placeholder.jpg"
                alt="Michael Brown"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23ddd" width="150" height="150"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EMB%3C/text%3E%3C/svg%3E';
                }}
              />
              <h3>Michael Brown</h3>
              <p className="credentials">Certified Scrum Master (CSM)</p>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                Lead Software Engineer
              </p>
              <p>
                Michael is responsible for the development and maintenance of our
                software. With his expertise in coding and problem-solving, he plays a
                crucial role in keeping our platform robust and efficient.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
};

export default AboutPage;
