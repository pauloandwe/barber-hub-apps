import { useState } from "react";
import { barbersAPI } from "@/api/barbers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { DialogProps } from "@/types/shared.types";

interface BarberDialogProps extends DialogProps {
  barbershopId: string;
  onSuccess: () => void;
}

interface BarberFormData {
  name: string;
  bio: string;
}

const INITIAL_FORM_STATE: BarberFormData = {
  name: "",
  bio: "",
};

export function BarberDialog({
  open,
  onOpenChange,
  barbershopId,
  onSuccess,
}: BarberDialogProps) {
  const [formData, setFormData] = useState<BarberFormData>(INITIAL_FORM_STATE);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name || formData.name.trim().length === 0) {
      toast.error("Please enter barber name");
      return false;
    }

    if (formData.name.length < 3) {
      toast.error("Name must be at least 3 characters");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const barbershopIdNum = parseInt(barbershopId, 10);
      await barbersAPI.create({
        businessId: barbershopIdNum,
        name: formData.name,
        specialties: [],
        active: true,
      });

      toast.success("Barber created successfully!");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error creating barber:", error);
      }
      toast.error("Error creating barber");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Barber</DialogTitle>
          <DialogDescription>
            Register a new barber for your barbershop
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Barber Name *</Label>
            <Input
              id="name"
              type="text"
              name="name"
              placeholder="Ex: John Doe"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio (optional)</Label>
            <Textarea
              id="bio"
              name="bio"
              placeholder="Brief description about the barber..."
              value={formData.bio}
              onChange={handleInputChange}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default BarberDialog;
