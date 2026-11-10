'use client';

import {
    type ComponentProps,
    createContext,
    type ReactNode,
    useContext,
    useId,
    useMemo,
} from 'react';
import { cn } from '../lib/cn';
import { FieldContext, FieldLabel } from './field';

/*
 * A disabled fieldset only reaches native controls; Base UI's Switch and Select triggers are spans and
 * buttons wired through the Field context, so the group hands its state to each row instead.
 */
const SettingGroupDisabledContext = createContext(false);

export type SettingRowProps = Omit<ComponentProps<'div'>, 'title'> & {
    title: ReactNode;
    description?: ReactNode;
    /** The trailing control: a <Switch />, a <Select> picker, a <Button />, or nothing. */
    control?: ReactNode;
    /**
     * Whether the title labels the control. Leave it on for a Switch, Select or Checkbox, so a click
     * on the title toggles or opens it and a screen reader names it by the title. Turn it off for an
     * action button, whose own text ("Add credits") must stay its name.
     */
    labelControl?: boolean;
    /** Disables a form control in the slot through the Field context and dims the text with it. */
    disabled?: boolean;
    /** The id the form control in the slot takes; generated when left out. */
    controlId?: string;
    /**
     * The row depends on the one above it (a setting that only matters while its parent is on). In
     * a SettingGroup it sits with that parent, 16 below it, with no hairline between. Disabling it
     * while the parent is off is the caller's, through `disabled`.
     */
    dependent?: boolean;
};

/**
 * A setting: title and description on the left, its control on the right. The row is not a button;
 * the title is the control's label, and the description is wired in as its accessible description.
 */
export const SettingRow = ({
    title,
    description,
    control,
    labelControl = true,
    disabled: disabledProp = false,
    controlId,
    dependent = false,
    className,
    ...props
}: SettingRowProps) => {
    const disabled = useContext(SettingGroupDisabledContext) || disabledProp;
    const generatedId = useId();
    const id = controlId ?? generatedId;
    const descriptionId = description ? `${id}-description` : undefined;

    /*
     * The row opens its own Field context rather than wrapping a <Field>: the Field's stacked layout
     * and helper styling don't fit a row, but its controls already read their id, describedby and
     * disabled state from the context, so a Switch or SelectTrigger dropped in the slot is wired up.
     */
    const field = useMemo(
        () => ({
            id,
            labelId: `${id}-label`,
            helperId: descriptionId,
            // The description's id is known up front, so nothing needs to register itself.
            setHelperId: () => {},
            invalid: false,
            disabled,
        }),
        [id, descriptionId, disabled],
    );

    const titleClassName = 'font-medium text-neutral-950 text-xs';

    const content = (
        <div
            className={cn(
                // 38px holds a medium select without the row growing when its control changes.
                'flex min-h-control-lg items-center justify-between gap-4',
                className,
            )}
            data-dependent={dependent || undefined}
            data-disabled={disabled || undefined}
            data-slot="setting-row"
            {...props}
        >
            <div
                className={cn('flex min-w-0 flex-col gap-0.5', disabled && 'opacity-50')}
                data-slot="setting-row-text"
            >
                {labelControl && control ? (
                    <FieldLabel
                        className={cn(
                            titleClassName,
                            'w-fit',
                            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
                        )}
                        data-slot="setting-row-title"
                    >
                        {title}
                    </FieldLabel>
                ) : (
                    <p className={titleClassName} data-slot="setting-row-title" id={`${id}-label`}>
                        {title}
                    </p>
                )}
                {description && (
                    <p
                        className="font-normal text-neutral-600 text-xs"
                        data-slot="setting-row-description"
                        id={descriptionId}
                    >
                        {description}
                    </p>
                )}
            </div>
            {control && (
                /*
                 * A fieldset, so a disabled row reaches an action button in the slot as well: it does
                 * not read the Field context a form control does.
                 */
                <fieldset
                    className="flex min-w-0 shrink-0 items-center gap-2"
                    data-slot="setting-row-control"
                    disabled={disabled || undefined}
                >
                    {control}
                </fieldset>
            )}
        </div>
    );

    // An action button in the slot must not pick up the id or the description meant for a form control.
    return labelControl ? (
        <FieldContext.Provider value={field}>{content}</FieldContext.Provider>
    ) : (
        content
    );
};

export type SettingGroupProps = Omit<ComponentProps<'fieldset'>, 'title'> & {
    /** A quiet heading over the rows, such as "Notifications"; it also names the group. */
    title?: ReactNode;
};

/**
 * Setting rows under an optional quiet title, 16 apart, each divided from the next by a hairline at
 * the content's width: closeness alone never groups. A `dependent` row sits with the row above it,
 * 16 below and with no hairline between, so the pair reads as one setting. Several dependents take
 * an eyebrow naming what they belong to; mark that eyebrow `data-dependent` too, so it stays with
 * the parent.
 */
export const SettingGroup = ({
    title,
    disabled = false,
    className,
    children,
    ...props
}: SettingGroupProps) => {
    const titleId = useId();

    return (
        // A fieldset is the native group: a screen reader names it by the title on entering a control.
        <fieldset
            aria-labelledby={title ? titleId : undefined}
            className={cn('flex min-w-0 flex-col gap-3', className)}
            data-disabled={disabled || undefined}
            data-slot="setting-group"
            disabled={disabled}
            {...props}
        >
            {title && (
                <p
                    className="font-normal text-neutral-600 text-xs"
                    data-slot="setting-group-title"
                    id={titleId}
                >
                    {title}
                </p>
            )}
            <div
                className={cn(
                    'flex flex-col gap-4',
                    // A hairline 16 above every row after the first, unless it depends on the one before.
                    '[&>*+*:not([data-dependent])]:border-neutral-200 [&>*+*:not([data-dependent])]:border-t [&>*+*:not([data-dependent])]:pt-4',
                )}
                data-slot="setting-group-rows"
            >
                <SettingGroupDisabledContext.Provider value={disabled}>
                    {children}
                </SettingGroupDisabledContext.Provider>
            </div>
        </fieldset>
    );
};
