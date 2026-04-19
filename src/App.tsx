import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import AiChat from "./pages/AiChat.tsx";
import Studio from "./pages/Studio.tsx";
import StudioToolPage from "./pages/StudioToolPage.tsx";
import StudioQuickEdit from "./pages/StudioQuickEdit.tsx";
import Settings from "./pages/Settings.tsx";
import AlWajib from "./pages/AlWajib.tsx";
import TemplateEditor from "./pages/TemplateEditor.tsx";
import DataSaver from "./pages/DataSaver.tsx";
import ZoolShare from "./pages/ZoolShare.tsx";
import Scanner from "./pages/Scanner.tsx";
import ZoolYafatish from "./pages/ZoolYafatish.tsx";
import VoiceChanger from "./pages/VoiceChanger.tsx";
import NotFound from "./pages/NotFound.tsx";
import VoiceNotesFAB from "./components/VoiceNotesFAB.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/chat" element={<AiChat />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/studio/quick" element={<StudioQuickEdit />} />
          <Route path="/studio/:slug" element={<StudioToolPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/al-wajib" element={<AlWajib />} />
          <Route path="/al-wajib/editor/:id" element={<TemplateEditor />} />
          <Route path="/data-saver" element={<DataSaver />} />
          <Route path="/zool-share" element={<ZoolShare />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/yafatish" element={<ZoolYafatish />} />
          <Route path="/voice-changer" element={<VoiceChanger />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <VoiceNotesFAB />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
