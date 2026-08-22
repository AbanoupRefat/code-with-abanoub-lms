"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleEnrollment } from "@/app/manage/actions";

export default function EnrollmentToggle({ enrollmentId, initialIsActive }: { enrollmentId: string, initialIsActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isActive = e.target.checked;
    
    startTransition(async () => {
      const formData = new FormData();
      formData.append('enrollmentId', enrollmentId);
      if (isActive) {
        formData.append('isActive', 'on');
      }
      
      const result = await toggleEnrollment(formData);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <label className={`relative inline-flex items-center ${isPending ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}>
      <input 
        type="checkbox" 
        className="sr-only peer" 
        defaultChecked={initialIsActive}
        onChange={handleToggle}
        disabled={isPending}
      />
      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
    </label>
  );
}
