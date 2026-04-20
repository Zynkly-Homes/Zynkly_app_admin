import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Phone, Mail, Plus, Trash2, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  getSupportContacts, getSupportFaqs, upsertSupportFaq, deleteSupportFaq,
} from '@/services/adminService';

const faqSchema = z.object({
  question: z.string().min(5, 'Question is required'),
  answer: z.string().min(5, 'Answer is required'),
  order_index: z.coerce.number().min(0),
});

/**
 * Support page — view support contacts and manage FAQs.
 */
export default function Support() {
  const queryClient = useQueryClient();
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);

  const { data: contacts } = useQuery({ queryKey: ['support-contacts'], queryFn: getSupportContacts });
  const { data: faqs, isLoading: faqsLoading } = useQuery({ queryKey: ['support-faqs'], queryFn: getSupportFaqs });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(faqSchema),
  });

  const upsertMutation = useMutation({
    mutationFn: upsertSupportFaq,
    onSuccess: () => {
      toast.success(editingFaq ? 'FAQ updated' : 'FAQ added');
      queryClient.invalidateQueries({ queryKey: ['support-faqs'] });
      setFaqDialogOpen(false);
      setEditingFaq(null);
      reset();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSupportFaq,
    onSuccess: () => { toast.success('FAQ deleted'); queryClient.invalidateQueries({ queryKey: ['support-faqs'] }); },
    onError: (err) => toast.error(err.message),
  });

  const openEdit = (faq) => {
    setEditingFaq(faq);
    reset(faq);
    setFaqDialogOpen(true);
  };

  const openAdd = () => {
    setEditingFaq(null);
    reset({ question: '', answer: '', order_index: (faqs?.length ?? 0) + 1 });
    setFaqDialogOpen(true);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <h2 className="text-lg font-bold">Support</h2>

      {/* Contacts */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Support Contacts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!contacts?.length ? (
            <EmptyState title="No contacts" message="Add support contacts in the database." />
          ) : (
            contacts.map((c) => (
              <div key={c.id} className="flex items-center gap-4 p-3 rounded-lg border border-border">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  {c.type === 'email' ? <Mail className="w-4 h-4 text-primary" /> : <Phone className="w-4 h-4 text-primary" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.value}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* FAQs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">
            Frequently Asked Questions ({faqs?.length ?? 0})
          </CardTitle>
          <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={openAdd}>
            <Plus className="w-3.5 h-3.5" /> Add FAQ
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {faqsLoading ? (
            <div className="text-sm text-muted-foreground">Loading FAQs…</div>
          ) : !faqs?.length ? (
            <EmptyState title="No FAQs yet" message="Add FAQs that appear in the customer app." />
          ) : (
            faqs.map((faq) => (
              <div key={faq.id} className="p-4 rounded-lg border border-border space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{faq.question}</p>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(faq)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(faq.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* FAQ Dialog */}
      <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => upsertMutation.mutate({ ...editingFaq, ...d }))} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="faq-question">Question</Label>
              <Input id="faq-question" {...register('question')} />
              {errors.question && <p className="text-xs text-destructive">{errors.question.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="faq-answer">Answer</Label>
              <textarea
                id="faq-answer"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                {...register('answer')}
              />
              {errors.answer && <p className="text-xs text-destructive">{errors.answer.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="faq-order">Order</Label>
              <Input id="faq-order" type="number" {...register('order_index')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFaqDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{editingFaq ? 'Save' : 'Add FAQ'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
