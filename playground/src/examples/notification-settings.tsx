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
        // One card holds the group; a hairline divides each setting from the next.
        <Card className="w-full max-w-140">
            <SettingGroup title="Notifications">
                <SettingRow
                    control={<Switch checked={anomalies} onCheckedChange={setAnomalies} />}
                    description="Email when something is flagged for attention"
                    title="Anomaly alerts"
                />
                {/* Sensitivity shares its parent's space: no hairline between the two, one after them. */}
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
                    dependent
                    description="Threshold for flagging anomalies"
                    // Sensitivity means nothing while no anomaly alerts are sent.
                    disabled={!anomalies}
                    title="Alert sensitivity"
                />
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
