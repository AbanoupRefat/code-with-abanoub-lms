"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { EditableUnit, EditableLesson, EditableQuiz } from "./EditableCurriculum";
import Modal from "./Modal";
import SubmitButton from "./SubmitButton";
import { createUnit } from "@/app/manage/actions";
import { toast } from "sonner";

export default function CurriculumTab({ courseId, units }: { courseId: string, units: any[] }) {
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  const handleCreateUnit = async (formData: FormData) => {
    try {
      await createUnit(courseId, formData);
      toast.success("Unit created successfully!");
      setIsUnitModalOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Header with Green Trigger Button */}
      <div className="flex justify-between items-end">
        <h2 className="text-xl font-bold text-foreground">Course Curriculum</h2>
        <button 
          onClick={() => setIsUnitModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Add Unit
        </button>
      </div>

      <div className="space-y-4 mt-4">
        {units.slice().sort((a:any,b:any)=>a.order_index-b.order_index).map((unit: any) => (
          <EditableUnit key={unit.id} unit={unit} courseId={courseId}>
            {unit.lessons?.slice().sort((a:any,b:any)=>a.order_index-b.order_index).map((lesson: any) => (
              <EditableLesson key={lesson.id} lesson={lesson} courseId={courseId} />
            ))}
            {unit.quizzes?.slice().sort((a:any,b:any)=>a.order_index-b.order_index).map((quiz: any) => (
              <EditableQuiz key={quiz.id} quiz={quiz} courseId={courseId} />
            ))}
          </EditableUnit>
        ))}
        {(!units || units.length === 0) && (
          <div className="text-center p-12 border-2 border-dashed border-border rounded-lg bg-card/50">
            <p className="text-muted-foreground">Your course has no curriculum yet.</p>
            <button 
              onClick={() => setIsUnitModalOpen(true)}
              className="mt-4 text-green-600 font-medium hover:underline"
            >
              Click here to add your first unit.
            </button>
          </div>
        )}
      </div>

      {/* Add Unit Modal */}
      <Modal 
        isOpen={isUnitModalOpen} 
        onClose={() => setIsUnitModalOpen(false)} 
        title="Add New Unit"
      >
        <form action={handleCreateUnit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Unit Title</label>
            <input 
              type="text" 
              name="title" 
              placeholder="e.g. Introduction to React" 
              required 
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Order Index</label>
            <input 
              type="number" 
              name="order_index" 
              placeholder="e.g. 1" 
              required 
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" 
            />
          </div>
          <div className="pt-2 flex justify-end">
            <SubmitButton label="Create Unit" loadingLabel="Creating..." className="w-full" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
