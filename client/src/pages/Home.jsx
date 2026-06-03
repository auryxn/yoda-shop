import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section className="hero">
      <h1>Premium <span>Metal</span> Cases</h1>
      <p>
        Tough. Elegant. Yours. Handcrafted metal cases for those who demand more
        from their devices.
      </p>
      <Link to="/catalog" className="btn">Explore Collection</Link>
    </section>
  );
}
