import HomeButtons from "./components/HomeButtons";
import NavBar from "./components/NavBar";

function Home() {
  return (
    <div className="pl-40 absolute inset-0 flex items-center">
      <h1 className="font-vogue text-[10rem] tracking-tight text-white">
        Odyssey
      </h1>
    </div>
  );
}

function App() {
  return (
    <div className="relative min-h-screen bg-black">
      {/* <NavBar />
      <Home /> */}
      <HomeButtons />
    </div>
  );
}

export default App;
