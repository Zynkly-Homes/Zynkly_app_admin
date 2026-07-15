import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Phone, Mail, Plus, Trash2, Pencil, LifeBuoy, ChevronDown, ChevronUp, MessageCircleQuestion, X, Loader2, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonGrid } from '@/components/shared/SkeletonLoader';
import { cn } from '@/lib/utils';
import {
  getSupportContacts, getSupportFaqs, upsertSupportFaq, deleteSupportFaq,
} from '@/services/adminService';

const faqSchema = z.object({
  question: z.string().min(5, 'Question is required'),
  answer: z.string().min(5, 'Answer is required'),
  order_index: z.coerce.number().min(0),
});

export default function Support() {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const { data: contacts, isLoading: contactsLoading } = useQuery({ queryKey: ['support-contacts'], queryFn: getSupportContacts });
  const { data: faqs, isLoading: faqsLoading } = useQuery({ queryKey: ['support-faqs'], queryFn: getSupportFaqs });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(faqSchema),
  });

  const upsertMutation = useMutation({
    mutationFn: upsertSupportFaq,
    onSuccess: () => {
      toast.success(editingFaq ? 'FAQ updated successfully' : 'FAQ added successfully');
      queryClient.invalidateQueries({ queryKey: ['support-faqs'] });
      setDrawerOpen(false);
      setEditingFaq(null);
      reset();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSupportFaq,
    onSuccess: () => { 
      toast.success('FAQ deleted'); 
      queryClient.invalidateQueries({ queryKey: ['support-faqs'] }); 
    },
    onError: (err) => toast.error(err.message),
  });

  // Drawer handlers
  const openEdit = (faq) => {
    setEditingFaq(faq);
    reset(faq);
    setDrawerOpen(true);
  };

  const openAdd = () => {
    setEditingFaq(null);
    reset({ question: '', answer: '', order_index: (faqs?.length ?? 0) + 1 });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-stagger-up stagger-1">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Help Center</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage global support contacts and public FAQs</p>
        </div>
        <Button 
          onClick={openAdd} 
          className="bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-[0_2px_10px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_15px_rgba(99,102,241,0.4)] rounded-xl border-none transition-all duration-300 px-6 h-11"
        >
          <Plus className="w-4 h-4 mr-2" /> Add New FAQ
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        
        {/* LEFT COLUMN: Support Contacts */}
        <div className="lg:col-span-4 animate-stagger-up stagger-2 space-y-6">
          <div className="bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 lg:p-8 ring-1 ring-black/5 inset">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 border border-indigo-500/20 shadow-inner">
                <LifeBuoy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Contact Lines</h3>
                <p className="text-xs text-slate-500 font-medium">Customer-facing support channels</p>
              </div>
            </div>

            <div className="space-y-4">
              {contactsLoading ? (
                <SkeletonGrid count={2} cardHeight="h-[80px]" className="grid-cols-1" />
              ) : !contacts?.length ? (
                <p className="text-sm text-slate-400 italic text-center py-6">No contacts configured.</p>
              ) : (
                contacts.map((c) => {
                  const isEmail = c.contact_type === 'email';
                  return (
                    <div 
                      key={c.id} 
                      className="group p-4 rounded-2xl bg-white/50 border border-white/60 hover:bg-white hover:shadow-md transition-all duration-300 flex items-center gap-4 cursor-default"
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shadow-inner shrink-0",
                        isEmail ? "bg-cyan-50 text-cyan-600 border border-cyan-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      )}>
                        {isEmail ? <Mail className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{c.title}</p>
                        <p className="text-sm text-slate-600 font-mono mt-0.5 truncate select-all">{c.contact_value}</p>
                        {c.subtitle && <p className="text-xs text-slate-400 mt-1 truncate">{c.subtitle}</p>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-200/50">
              <p className="text-xs text-slate-400 font-medium text-center leading-relaxed">
                Contact lines are displayed to customers in the App. To update these values, please edit them directly in the database.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FAQs */}
        <div className="lg:col-span-8 animate-stagger-up stagger-3">
          <div className="bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 lg:p-8 ring-1 ring-black/5 inset min-h-[500px] flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20 shadow-inner">
                <MessageCircleQuestion className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Knowledge Base</h3>
                <p className="text-xs text-slate-500 font-medium">{faqs?.length ?? 0} published FAQs</p>
              </div>
            </div>

            {faqsLoading ? (
              <div className="space-y-4">
                <SkeletonGrid count={4} cardHeight="h-[70px]" className="grid-cols-1" />
              </div>
            ) : !faqs?.length ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState 
                  icon={Sparkles} 
                  title="Knowledge base is empty" 
                  message="Add some frequently asked questions to help your customers." 
                />
              </div>
            ) : (
              <div className="space-y-4">
                {faqs.map((faq) => {
                  const isExpanded = expandedFaq === faq.id;
                  return (
                    <div 
                      key={faq.id} 
                      className={cn(
                        "rounded-2xl border transition-all duration-300 overflow-hidden bg-white/50",
                        isExpanded ? "border-indigo-200 shadow-md ring-1 ring-indigo-500/10" : "border-white/60 hover:border-slate-300 hover:bg-white"
                      )}
                    >
                      <div 
                        className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                        onClick={() => toggleFaq(faq.id)}
                      >
                        <h4 className={cn("text-sm font-bold pr-8", isExpanded ? "text-indigo-900" : "text-slate-700")}>
                          {faq.question}
                        </h4>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Quick Actions (only visible on hover or expanded) */}
                          <div className={cn(
                            "flex gap-1 transition-opacity", 
                            isExpanded ? "opacity-100" : "opacity-0 md:group-hover:opacity-100" // Group hover trick requires group on parent, but we want it visible anyway if expanded
                          )}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" 
                              onClick={(e) => { e.stopPropagation(); openEdit(faq); }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" 
                              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(faq.id); }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                             {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>
                      
                      {/* Expandable Answer Area */}
                      <div className={cn(
                        "transition-all duration-300 ease-in-out px-5 text-sm text-slate-600 leading-relaxed border-t",
                        isExpanded ? "py-5 opacity-100 border-slate-100 bg-white" : "max-h-0 py-0 opacity-0 border-transparent overflow-hidden"
                      )}>
                        {faq.answer}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop for Drawer */}
      <div
        onClick={closeDrawer}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          transition: 'opacity 0.3s ease',
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'auto' : 'none',
        }}
        aria-hidden="true"
      />

      {/* Slide-Over Drawer for FAQ */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '500px',
          zIndex: 9999,
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(30px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.1)',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/50 bg-white/40">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {editingFaq ? 'Edit Knowledge Base Entry' : 'New Knowledge Base Entry'}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1">Publish answers to common customer questions</p>
          </div>
          <button
            onClick={closeDrawer}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <form id="faq-form" onSubmit={handleSubmit((d) => upsertMutation.mutate({ ...editingFaq, ...d }))} className="space-y-6">
            
            <div className="space-y-2">
              <Label htmlFor="faq-question" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Question</Label>
              <Input 
                id="faq-question" 
                {...register('question')} 
                placeholder="e.g., How do I reschedule my booking?"
                className="h-12 rounded-xl bg-white/60 border-white/80 focus:bg-white shadow-sm font-medium" 
              />
              {errors.question && <p className="text-xs text-rose-500 font-medium">{errors.question.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="faq-answer" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Comprehensive Answer</Label>
              <textarea
                id="faq-answer"
                className="flex min-h-[160px] w-full rounded-xl border border-white/80 bg-white/60 px-4 py-3 text-sm font-medium shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 resize-none transition-colors focus:bg-white"
                placeholder="Provide a detailed, helpful answer..."
                {...register('answer')}
              />
              {errors.answer && <p className="text-xs text-rose-500 font-medium">{errors.answer.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="faq-order" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Display Priority</Label>
              <Input 
                id="faq-order" 
                type="number" 
                {...register('order_index')} 
                className="h-12 rounded-xl bg-white/60 border-white/80 focus:bg-white shadow-sm font-medium w-full sm:w-1/3" 
              />
              <p className="text-[10px] text-slate-400 font-medium">Lower numbers appear first in the list.</p>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-white/50 bg-white/40 flex justify-end gap-3 mt-auto">
          <Button type="button" variant="ghost" className="rounded-xl font-bold h-11 px-6 text-slate-600 hover:bg-white hover:text-slate-900" onClick={closeDrawer}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="faq-form"
            disabled={isSubmitting || upsertMutation.isPending} 
            className="rounded-xl bg-slate-900 text-white font-bold shadow-lg hover:bg-slate-800 h-11 px-8 gap-2"
          >
            {isSubmitting || upsertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {editingFaq ? 'Save Changes' : 'Publish FAQ'}
          </Button>
        </div>
      </aside>

    </div>
  );
}
