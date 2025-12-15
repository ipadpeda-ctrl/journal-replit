import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Calculator } from "lucide-react";
import ConfluenceTag from "./ConfluenceTag";

const PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "USDCAD", "AUDUSD", "NZDUSD", "USDCHF", "XAUUSD", "BTCUSD", "ETHUSD", "NDX100", "US30", "GER40"];
const EMOTIONS = ["Calmo", "Ansioso", "Fiducioso", "Impaziente", "Frustrato", "Euforico", "Dubbioso", "Vendicativo"];

export default function NewEntryForm() {
  const { toast } = useToast();
  
  // Dati base
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(new Date().toTimeString().split(" ")[0].slice(0, 5));
  const [pair, setPair] = useState("");
  const [direction, setDirection] = useState<"long" | "short">("long");
  
  // Prezzi per calcolo automatico
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLossPrice, setStopLossPrice] = useState("");
  const [takeProfitPrice, setTakeProfitPrice] = useState("");

  // Dati calcolati o manuali
  const [target, setTarget] = useState(""); // % Profitto
  const [stopLoss, setStopLoss] = useState(""); // % Rischio
  const [result, setResult] = useState("non_fillato");
  const [emotion, setEmotion] = useState("Calmo"); // Valore di default per evitare crash
  const [notes, setNotes] = useState("");
  
  // Confluenze
  const [confluencesPro, setConfluencesPro] = useState<string[]>([]);
  const [confluencesContro, setConfluencesContro] = useState<string[]>([]);
  const [newPro, setNewPro] = useState("");
  const [newContro, setNewContro] = useState("");

  const [imageUrl, setImageUrl] = useState("");

  // CALCOLO AUTOMATICO RR E PERCENTUALI
  useEffect(() => {
    if (entryPrice && stopLossPrice && takeProfitPrice) {
      const entry = parseFloat(entryPrice);
      const sl = parseFloat(stopLossPrice);
      const tp = parseFloat(takeProfitPrice);

      if (!isNaN(entry) && !isNaN(sl) && !isNaN(tp) && entry !== 0) {
        // Calcolo Risk Reward
        const risk = Math.abs(entry - sl);
        const reward = Math.abs(tp - entry);
        
        // Calcolo Percentuale Rischio (Stimato su entry)
        const riskPercent = (risk / entry) * 100;
        const rewardPercent = (reward / entry) * 100;

        // Se è SHORT, il TP deve essere più basso dell'Entry
        if (direction === "short" && tp > entry) return; 
        // Se è LONG, il TP deve essere più alto
        if (direction === "long" && tp < entry) return;

        setStopLoss(riskPercent.toFixed(2));
        setTarget(rewardPercent.toFixed(2));
      }
    }
  }, [entryPrice, stopLossPrice, takeProfitPrice, direction]);

  const addConfluence = (type: "pro" | "contro") => {
    if (type === "pro" && newPro.trim()) {
      setConfluencesPro([...confluencesPro, newPro.trim()]);
      setNewPro("");
    } else if (type === "contro" && newContro.trim()) {
      setConfluencesContro([...confluencesContro, newContro.trim()]);
      setNewContro("");
    }
  };

  const removeConfluence = (type: "pro" | "contro", index: number) => {
    if (type === "pro") {
      setConfluencesPro(confluencesPro.filter((_, i) => i !== index));
    } else {
      setConfluencesContro(confluencesContro.filter((_, i) => i !== index));
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const finalTarget = parseFloat(target);
      const finalStop = parseFloat(stopLoss);

      if (isNaN(finalTarget) || isNaN(finalStop)) {
        throw new Error("Inserisci valori validi per Target e Stop Loss");
      }

      if (!pair) {
         throw new Error("Seleziona una coppia");
      }

      return apiRequest("POST", "/api/trades", {
        date,
        time,
        pair,
        direction,
        target: finalTarget,
        stopLoss: finalStop,
        result,
        emotion: emotion || "Nessuna",
        notes,
        confluencesPro,
        confluencesContro,
        imageUrls: imageUrl ? [imageUrl] : [],
      });
    },
    onSuccess: () => {
      toast({ title: "Trade aggiunto con successo!" });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      
      // Reset form
      setPair("");
      setEntryPrice("");
      setStopLossPrice("");
      setTakeProfitPrice("");
      setTarget("");
      setStopLoss("");
      setResult("non_fillato");
      setEmotion("Calmo");
      setNotes("");
      setConfluencesPro([]);
      setConfluencesContro([]);
      setImageUrl("");
    },
    onError: (error: Error) => {
      toast({ 
        variant: "destructive", 
        title: "Errore", 
        description: error.message 
      });
    },
  });

  const getRiskRewardRatio = () => {
    const rTarget = parseFloat(target);
    const rStop = parseFloat(stopLoss);
    if (rTarget > 0 && rStop > 0) {
      return (rTarget / rStop).toFixed(2);
    }
    return "0.00";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Nuova Operazione</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* RIGA 1: Data, Ora, Pair, Direzione */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Ora</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Coppia</Label>
            <Select value={pair} onValueChange={setPair}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona" />
              </SelectTrigger>
              <SelectContent>
                {PAIRS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Direzione</Label>
            <Select value={direction} onValueChange={(v: "long" | "short") => setDirection(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="long">Long (Buy)</SelectItem>
                <SelectItem value="short">Short (Sell)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* RIGA 2: PREZZI (Entry, SL, TP) */}
        <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-chart-1" />
            <h3 className="text-sm font-semibold">Prezzi (Calcolo Automatico)</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Prezzo Entry</Label>
              <Input 
                type="number" 
                step="0.00001" 
                placeholder="es. 1.1050" 
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Prezzo Stop Loss</Label>
              <Input 
                type="number" 
                step="0.00001" 
                placeholder="es. 1.1000" 
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Prezzo Take Profit</Label>
              <Input 
                type="number" 
                step="0.00001" 
                placeholder="es. 1.1200" 
                value={takeProfitPrice}
                onChange={(e) => setTakeProfitPrice(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* RIGA 3: Percentuali e Risultati */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Rischio (%)</Label>
            <Input 
              type="number" 
              step="0.1" 
              value={stopLoss} 
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="1.0"
            />
          </div>
          <div className="space-y-2">
            <Label>Target (%)</Label>
            <Input 
              type="number" 
              step="0.1" 
              value={target} 
              onChange={(e) => setTarget(e.target.value)}
              placeholder="2.0"
            />
          </div>
          <div className="space-y-2">
            <Label>Risk/Reward</Label>
            <div className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-muted px-3 py-2 text-sm font-medium">
              1 : {getRiskRewardRatio()}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Risultato</Label>
            <Select value={result} onValueChange={setResult}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="non_fillato">Pending / Non Fillato</SelectItem>
                <SelectItem value="target">Target (Profit)</SelectItem>
                <SelectItem value="stop_loss">Stop Loss</SelectItem>
                <SelectItem value="breakeven">Breakeven</SelectItem>
                <SelectItem value="parziale">Parziale</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* RIGA 4: Emozioni e Screenshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Emozione Prevalente</Label>
            <Select value={emotion} onValueChange={setEmotion}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nessuna">Nessuna</SelectItem> 
                {EMOTIONS.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Screenshot URL (Opzionale)</Label>
            <Input 
              placeholder="https://..." 
              value={imageUrl} 
              onChange={(e) => setImageUrl(e.target.value)} 
            />
          </div>
        </div>

        {/* RIGA 5: Confluenze */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-emerald-600 font-bold">Confluenze A FAVORE (Pro)</Label>
            <div className="flex gap-2">
              <Input 
                value={newPro} 
                onChange={(e) => setNewPro(e.target.value)} 
                placeholder="Es. Trendline, Supporto..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addConfluence("pro"))}
              />
              <Button type="button" size="icon" onClick={() => addConfluence("pro")} className="shrink-0 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-muted/30 rounded-md border border-dashed">
              {confluencesPro.map((c, i) => (
                <ConfluenceTag key={i} label={c} type="pro" onRemove={() => removeConfluence("pro", i)} />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-red-600 font-bold">Confluenze CONTRO</Label>
            <div className="flex gap-2">
              <Input 
                value={newContro} 
                onChange={(e) => setNewContro(e.target.value)} 
                placeholder="Es. News contro, Resistenza..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addConfluence("contro"))}
              />
              <Button type="button" size="icon" onClick={() => addConfluence("contro")} className="shrink-0 bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-muted/30 rounded-md border border-dashed">
              {confluencesContro.map((c, i) => (
                <ConfluenceTag key={i} label={c} type="contro" onRemove={() => removeConfluence("contro", i)} />
              ))}
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="space-y-2">
          <Label>Note / Diario</Label>
          <Textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            placeholder="Descrivi la tua esecuzione, i tuoi pensieri..."
            className="h-24"
          />
        </div>

        <Button 
          className="w-full h-12 text-lg font-bold" 
          onClick={() => mutation.mutate()} 
          disabled={mutation.isPending}
        >
          {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
          Salva Operazione
        </Button>
      </CardContent>
    </Card>
  );
}