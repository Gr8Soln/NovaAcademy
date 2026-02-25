import { Rocket, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./buttons";

interface ComingSoonProps {
    feature?: string;
    description?: string;
}

export function ComingSoon({
    feature = "This Feature",
    description = "We're working hard to bring you something amazing. Stay tuned!"
}: ComingSoonProps) {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
            <div className="relative group mb-8">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-accent-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

                {/* Icon Container */}
                <div className="relative h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-xl border border-neutral-100">
                    <Rocket className="h-12 w-12 text-primary-600 animate-bounce-slow" />
                </div>
            </div>

            <div className="max-w-md space-y-4">
                <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-accent-600">
                        Coming Soon
                    </span>
                </h1>

                <h2 className="text-xl font-semibold text-neutral-800">
                    {feature} is under construction
                </h2>

                <p className="text-neutral-500 leading-relaxed">
                    {description}
                </p>

                <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                        onClick={() => navigate(-1)}
                        variant="outline"
                        className="flex items-center gap-2 px-8"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Go Back
                    </Button>

                    <Button
                        className="bg-primary-600 hover:bg-primary-700 text-white px-8"
                    >
                        Notify Me
                    </Button>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse -z-10"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000 -z-10"></div>
        </div>
    );
}
