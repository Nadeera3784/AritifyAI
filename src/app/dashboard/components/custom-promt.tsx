"use client"

import React from 'react';
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface CustomPromptProps {
  visibility: boolean;
  customPromptRef: React.RefObject<HTMLTextAreaElement>;
}


export const CustomPrompt: React.FC<CustomPromptProps> = ({ visibility, customPromptRef}) => {
   return (
    visibility && 
      <div className="grid gap-2">
          <Label htmlFor="model">Custom prompts</Label>
          <Textarea placeholder="Type your message here." ref={customPromptRef}/>
      </div>
  );
}
