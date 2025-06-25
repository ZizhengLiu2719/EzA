import FeatureSteps from '../components/FeatureSteps'
import Footer from '../components/Footer'
import Hero from '../components/Hero'
import Navbar from '../components/Navbar'

const Home = () => {
  return (
    <div className="home">
      <Navbar />
      <Hero />
      <FeatureSteps />
      <Footer />
    </div>
  )
}

export default Home 