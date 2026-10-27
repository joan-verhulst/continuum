import {
    Card,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SettingGroup,
    SettingRow,
    Switch,
} from 'continuum';
import { useState } from 'react';

type Sensitivity = 'low' | 'medium' | 'high';

/** The "Notifications" settings card: alert switches and a sensitivity picker that follows them. */
export const notificationSettingsExample = () => <NotificationSettings />;

const NotificationSettings = () => {
    const [anomalies, setAnomalies] = useState(true);
    const [sensitivity, setSensitivity] = useState<Sensitivity>('medium');
    const [dailySummary, setDailySummary] = useState(false);
    const [weeklyDigest, setWeeklyDigest] = useState(false);

    return (
        // One card holds the group; the rows are kept apart by space, not the design's dividers.
        <Card className="w-full max-w-[560px]">
            <SettingGroup title="Notifications">
                {/* Sensitivity sits tight under the switch it depends on; space, not a rule, sets the pair off. */}
                <div className="flex flex-col gap-1">
                    <SettingRow
                        control={<Switch checked={anomalies} onCheckedChange={setAnomalies} />}
                        description="Email when something is flagged for attention"
                        title="Anomaly alerts"
                    />
                    <SettingRow
                        control={
                            <Select<Sensitivity> onValueChange={setSensitivity} value={sensitivity}>
                                {/* A fixed width keeps the trigger still as "Low" becomes "Medium". */}
                                <SelectTrigger className="w-28" indicator="right" size="sm">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        }
                        description="Threshold for flagging anomalies"
                        // Sensitivity means nothing while no anomaly alerts are sent.
                        disabled={!anomalies}
                        title="Alert sensitivity"
                    />
                </div>
                <SettingRow
                    control={<Switch checked={dailySummary} onCheckedChange={setDailySummary} />}
                    description="Yesterday’s key metrics each morning"
                    title="Daily summary"
                />
                <SettingRow
                    control={<Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />}
                    description="7-day overview every Monday"
                    title="Weekly digest"
                />
            </SettingGroup>
        </Card>
    );
};
