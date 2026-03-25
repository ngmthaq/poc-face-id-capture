import FaceRegister from "./FaceRegister";

export default function App() {
  return (
    <FaceRegister
      onComplete={(captures) => console.log("Captures:", captures)}
    />
  );
}
