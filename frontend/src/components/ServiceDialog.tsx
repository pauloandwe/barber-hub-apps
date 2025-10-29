import { useEffect, useState } from "react";
import { Service, servicesAPI } from "@/api/services";
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
  service?: Service | null;
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
  service,
}: ServiceDialogProps) {
  const [formData, setFormData] = useState<ServiceFormData>(INITIAL_FORM_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = Boolean(service);

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
      const payload = {
        name: formData.name,
        description: undefined,
        duration: parseInt(formData.duration, 10),
        price: parseFloat(formData.price),
      };

      if (isEditMode && service) {
        await servicesAPI.update(service.id, payload);
        toast.success("Service updated successfully!");
      } else {
        const barbershopIdNum = parseInt(barbershopId, 10);
        await servicesAPI.create({
          businessId: barbershopIdNum,
          ...payload,
          active: true,
        });
        toast.success("Service created successfully!");
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(isEditMode ? "Error updating service:" : "Error creating service:", error);
      }
      toast.error(isEditMode ? "Error updating service" : "Error creating service");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
  };

  useEffect(() => {
    if (open && isEditMode && service) {
      setFormData({
        name: service.name ?? "",
        price:
          typeof service.price === "number"
            ? (service.price / 100).toFixed(2)
            : "",
        duration:
          service.duration !== undefined ? String(service.duration) : "",
      });
    }
    if (!open) {
      resetForm();
    }
  }, [open, isEditMode, service]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Service" : "New Service"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the service details below"
              : "Create a new service for your barbershop"}
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
              {isEditMode ? "Save changes" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ServiceDialog;
