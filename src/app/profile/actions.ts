"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Must be logged in to update profile");
  }

  const fullName = formData.get("full_name") as string;

  if (fullName) {
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating profile:", error);
      throw new Error(error.message);
    }
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/courses");
}
