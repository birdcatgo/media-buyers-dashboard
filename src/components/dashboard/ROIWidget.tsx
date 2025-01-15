import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from 'lucide-react';

interface ROIWidgetProps {
  roi: number;
}

export const ROIWidget: React.FC<ROIWidgetProps> = ({ roi }) => {
  return (
    <Card>
      <CardContent className="flex items-center p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-muted-foreground">ROI</p>
          <h3 className="text-2xl font-bold">{roi.toFixed(2)}%</h3>
        </div>
      </CardContent>
    </Card>
  );
}; 