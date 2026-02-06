"use client";

import { UserContext } from "@/types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HelpCircle } from "lucide-react";

interface UserContextFormProps {
    context: UserContext;
    onChange: (context: UserContext) => void;
}

export function UserContextForm({ context, onChange }: UserContextFormProps) {
    const updateField = (field: keyof UserContext, value: string) => {
        onChange({ ...context, [field]: value });
    };

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mt-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="font-semibold text-lg">Personalize Your Explanation (Optional)</h3>
                <span className="text-xs text-muted-foreground bg-white border px-2 py-0.5 rounded-full">
                    Private
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <Label>My Language *</Label>
                    <Select
                        value={context.language}
                        onValueChange={(val: any) => updateField('language', val)}
                    >
                        <SelectTrigger className="bg-white border-blue-600/20 ring-offset-0 focus:ring-0">
                            <SelectValue placeholder="Select Language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="hi">Hindi (हिंदी)</SelectItem>
                            <SelectItem value="ta">Tamil (தமிழ்)</SelectItem>
                            <SelectItem value="or">Odia (ଓଡ଼ିଆ)</SelectItem>
                            <SelectItem value="mr">Marathi (मराठी)</SelectItem>
                            <SelectItem value="gu">Gujarati (ગુજરાતી)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                        Age
                    </Label>
                    <Input
                        type="number"
                        placeholder="e.g. 45"
                        className="bg-white"
                        value={context.age || ''}
                        onChange={(e) => updateField('age', e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                        placeholder="State/District"
                        className="bg-white"
                        value={context.location || ''}
                        onChange={(e) => updateField('location', e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Occupation</Label>
                    <Select
                        value={context.occupation || ''}
                        onValueChange={(val) => updateField('occupation', val)}
                    >
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="farmer">Farmer</SelectItem>
                            <SelectItem value="business">Business / Self-Employed</SelectItem>
                            <SelectItem value="salaried">Salaried Employee</SelectItem>
                            <SelectItem value="retired">Retired / Senior Citizen</SelectItem>
                            <SelectItem value="homemaker">Homemaker</SelectItem>
                            <SelectItem value="unemployed">Unemployed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
