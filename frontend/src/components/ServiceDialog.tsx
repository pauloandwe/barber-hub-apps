import { useState } from "react";
import { servicesAPI } from "@/api/services";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { DialogProps } from "@/types/shared.types";

interface ServiceDialogProps extends DialogProps {
  barbershopId: string;
  onSuccess: () => void;
}

interface ServiceFormData {
  name: string;
  price: string;
  duration: string;
}

const INITIAL_FORM_STATE: ServiceFormData = {
  name: "",
  price: "",
  duration: "",
};

export function ServiceDialog({
  open,
  onOpenChange,
  barbershopId,
  onSuccess,
}: ServiceDialogProps) {
  const [formData, setFormData] = useState<ServiceFormData>(INITIAL_FORM_STATE);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name || !formData.price || !formData.duration) {
      toast.error("Please fill in all fields");
      return false;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      toast.error("Please enter a valid price");
      return false;
    }

    const duration = parseInt(formData.duration, 10);
    if (isNaN(duration) || duration < 5) {
      toast.error("Duration must be at least 5 minutes");
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
      await servicesAPI.create({
        businessId: barbershopIdNum,
        name: formData.name,
        description: undefined,
        duration: parseInt(formData.duration, 10),
        price: parseFloat(formData.price),
        active: true,
      });

      toast.success("Service created successfully!");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error creating service:", error);
      }
      toast.error("Error creating service");
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
          <DialogTitle>New Service</DialogTitle>
          <DialogDescription>
            Create a new service for your barbershop
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Service Name *</Label>
            <Input
              id="name"
              type="text"
              name="name"
              placeholder="Ex: Haircut"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (USD) *</Label>
            <Input
              id="price"
              type="number"
              name="price"
              step="0.01"
              min="0"
              placeholder="Ex: 30.00"
              value={formData.price}
              onChange={handleInputChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes) *</Label>
            <Input
              id="duration"
              type="number"
              name="duration"
              min="5"
              step="5"
              placeholder="Ex: 30"
              value={formData.duration}
              onChange={handleInputChange}
              disabled={isLoading}
              required
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

export default ServiceDialog;
