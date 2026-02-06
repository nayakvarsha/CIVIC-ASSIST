import { ShieldCheck, Scale } from "lucide-react";

export function Header() {
    return (
        <header className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                        <Scale className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight tracking-tight">
                            Civic Translator <span className="text-blue-600 font-extrabold">& Explainer</span>
                        </h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                            Citizen Empowerment Assistant
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Private & Secure • No Data Stored</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground border px-2 py-0.5 rounded">
                        BETA PREVIEW
                    </div>
                </div>
            </div>
        </header>
    );
}
