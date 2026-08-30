import { Settings } from "lucide-react";

const Loader = () => {
  return (
    <div className="relative w-full p-4 flex justify-center items-center">
      <div className="relative">
        <Settings
          className="animate-spin text-teal-700"
          style={{ animationDuration: "2.5s" }}
          size={50}
        />
        <Settings
          className="absolute -bottom-3 left-0 animate-spin text-teal-600"
          style={{ animationDuration: "3s" }}
          size={22}
        />
      </div>
    </div>
  );
};

export default Loader;
