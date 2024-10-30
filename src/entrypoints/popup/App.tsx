import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Plus, AlertCircle } from "lucide-react";

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [filters, setFilters] = useState<Filter[]>([{ id: 1, pattern: "", isValid: true }]);
  const [testComment, setTestComment] = useState("");
  const [testResult, setTestResult] = useState<{ isBlocked: boolean; matches: Filter[] } | null>(null);

  const validateRegex = (pattern: string) => {
    try {
      new RegExp(pattern);
      return true;
    } catch {
      return false;
    }
  };

  const addNewFilter = () => {
    setFilters([...filters, { id: Date.now(), pattern: "", isValid: true }]);
  };

  const removeFilter = (id: number) => {
    setFilters(filters.filter((filter) => filter.id !== id));
  };

  const updateFilter = (id: number, newPattern: string) => {
    setFilters(
      filters.map((filter) => {
        if (filter.id === id) {
          return {
            ...filter,
            pattern: newPattern,
            isValid: validateRegex(newPattern),
          };
        }
        return filter;
      }),
    );
  };

  const testFilters = () => {
    if (!testComment) {
      setTestResult(null);
      return;
    }

    const matchingFilters = filters.filter((filter) => {
      if (!filter.pattern || !filter.isValid) return false;
      try {
        const regex = new RegExp(filter.pattern);
        return regex.test(testComment);
      } catch {
        return false;
      }
    });

    setTestResult({
      isBlocked: matchingFilters.length > 0,
      matches: matchingFilters,
    });
  };

  useEffect(() => {
    (async () => {
      const isEnabled = await storage.getItem<boolean>(Keys.isEnabled, {
        fallback: true,
      });
      setIsEnabled(isEnabled);

      const filters = await storage.getItem<Filter[]>(Keys.filters, {
        fallback: [{ id: 1, pattern: "", isValid: true }],
      });
      setFilters(filters);

      setIsInitialized(true);
    })();
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }
    storage.setItem(Keys.isEnabled, isEnabled);
  }, [isEnabled, isInitialized]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }
    storage.setItem(Keys.filters, filters);
  }, [filters, isInitialized]);

  if (!isInitialized) {
    return null;
  }

  return (
    <Card className="w-96 rounded-none">
      <CardHeader>
        <CardTitle>{i18n.t("popup.title")}</CardTitle>
        <CardDescription>{i18n.t("popup.description")}</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm">
            {i18n.t("popup.filter")} {isEnabled ? i18n.t("popup.enable") : i18n.t("popup.disable")}
          </span>
          <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
        </div>
        <div className="space-y-2">
          {filters.map((filter) => (
            <div key={filter.id} className="flex items-center space-x-2">
              <Input
                placeholder={i18n.t("popup.pattern")}
                value={filter.pattern}
                onChange={(e) => updateFilter(filter.id, e.target.value)}
                className={`flex-1 ${!filter.isValid && filter.pattern ? "border-red-500" : ""}`}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFilter(filter.id)}
                disabled={filters.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addNewFilter} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {i18n.t("popup.addFilter")}
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">{i18n.t("popup.testFilter")}</h3>
          <Input
            placeholder={i18n.t("popup.enterTestComment")}
            value={testComment}
            onChange={(e) => setTestComment(e.target.value)}
          />
          <Button onClick={testFilters} className="w-full" disabled={!testComment}>
            {i18n.t("popup.test")}
          </Button>

          {testResult && (
            <Alert variant={testResult.isBlocked ? "destructive" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center">
                {testResult.isBlocked ? (
                  <span>
                    {i18n.t("popup.blocked")}
                    {testResult.matches.map((filter) => (
                      <Badge key={filter.id} variant="outline" className="ml-2">
                        {filter.pattern}
                      </Badge>
                    ))}
                  </span>
                ) : (
                  i18n.t("popup.allowed")
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default App;
