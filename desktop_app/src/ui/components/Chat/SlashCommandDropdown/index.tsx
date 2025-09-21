import { ChevronRight, Command, Cpu, Hash, HelpCircle, Minimize2, RotateCcw, Sparkles, Wrench } from 'lucide-react';
import React, { memo, useCallback, useMemo } from 'react';

import { SlashCommand } from '@ui/lib/utils/slash-commands';
import { cn } from '@ui/lib/utils/tailwind';

interface SlashCommandSuggestion {
  command: SlashCommand;
  description: string;
}

interface SlashCommandDropdownProps {
  suggestions: SlashCommandSuggestion[];
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
  visible: boolean;
  inputRect?: DOMRect;
}

const getCommandIcon = (command: SlashCommand) => {
  switch (command) {
    case SlashCommand.CLEAR:
      return <Sparkles className="w-4 h-4" />;
    case SlashCommand.COMPACT:
      return <Minimize2 className="w-4 h-4" />;
    case SlashCommand.HELP:
      return <HelpCircle className="w-4 h-4" />;
    case SlashCommand.RETRY:
      return <RotateCcw className="w-4 h-4" />;
    case SlashCommand.MODELS:
      return <Cpu className="w-4 h-4" />;
    case SlashCommand.TOOLS:
      return <Wrench className="w-4 h-4" />;
    default:
      return <Command className="w-4 h-4" />;
  }
};

const getCommandCategory = (command: SlashCommand) => {
  switch (command) {
    case SlashCommand.CLEAR:
    case SlashCommand.COMPACT:
      return 'Chat Management';
    case SlashCommand.HELP:
      return 'Help';
    case SlashCommand.RETRY:
      return 'Actions';
    case SlashCommand.MODELS:
    case SlashCommand.TOOLS:
      return 'Configuration';
    default:
      return 'Other';
  }
};

const getCommandShortcut = (command: SlashCommand) => {
  switch (command) {
    case SlashCommand.CLEAR:
      return '⌘N';
    case SlashCommand.COMPACT:
      return '⌘K';
    case SlashCommand.HELP:
      return '?';
    case SlashCommand.RETRY:
      return '⌘R';
    case SlashCommand.MODELS:
      return '⌘M';
    case SlashCommand.TOOLS:
      return '⌘T';
    default:
      return '';
  }
};

export const SlashCommandDropdown = memo<SlashCommandDropdownProps>(function SlashCommandDropdown({
  suggestions,
  selectedIndex,
  onSelect,
  visible,
  inputRect,
}) {
  // Early return must happen before any hooks
  if (!visible || suggestions.length === 0) {
    return null;
  }

  const handleSelect = useCallback(
    (command: SlashCommand) => {
      onSelect(command);
    },
    [onSelect]
  );

  const dropdownStyle = useMemo(() => {
    return inputRect
      ? {
          position: 'fixed' as const,
          top: inputRect.top - 8,
          left: inputRect.left,
          width: Math.max(420, inputRect.width),
          zIndex: 1000,
          transform: 'translateY(-100%)',
        }
      : {
          position: 'absolute' as const,
          bottom: '100%',
          left: 0,
          right: 0,
          zIndex: 1000,
        };
  }, [inputRect]);

  return (
    <div
      style={dropdownStyle}
      className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-2xl overflow-hidden mb-2 animate-in fade-in-0 zoom-in-95 duration-200"
      role="listbox"
      aria-label="Slash commands"
      tabIndex={-1}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border/50">
        <Hash className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-medium text-foreground/80">SLASH COMMANDS</span>
        <span className="ml-auto text-xs text-muted-foreground">{suggestions.length}</span>
      </div>

      {/* Commands */}
      <div className="max-h-80 overflow-y-auto">
        {suggestions.map((suggestion, index) => {
          const isSelected = selectedIndex === index;
          const shortcut = getCommandShortcut(suggestion.command);
          const category = getCommandCategory(suggestion.command);

          return (
            <button
              key={suggestion.command}
              onClick={() => handleSelect(suggestion.command)}
              className={cn(
                'w-full text-left px-3 py-2.5 transition-colors flex items-center gap-3 group border-b border-border/20 last:border-b-0',
                'hover:bg-accent/50 focus:outline-none focus:bg-accent/50',
                isSelected && 'bg-accent text-accent-foreground'
              )}
              type="button"
              tabIndex={-1}
              role="option"
              aria-selected={isSelected}
              aria-describedby={`command-${suggestion.command.slice(1)}-desc`}
            >
              <div className="flex items-center justify-center w-5 h-5 text-muted-foreground group-hover:text-foreground">
                {getCommandIcon(suggestion.command)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm leading-none">{suggestion.command}</span>
                  <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md">{category}</span>
                </div>
                <div
                  id={`command-${suggestion.command.slice(1)}-desc`}
                  className="text-xs text-muted-foreground truncate leading-none mt-1"
                >
                  {suggestion.description}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {shortcut && (
                  <kbd className="px-1.5 py-0.5 bg-muted/60 text-muted-foreground rounded text-xs font-mono">
                    {shortcut}
                  </kbd>
                )}
                {isSelected && <ChevronRight className="w-3 h-3" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-3 py-2 bg-muted/20 border-t border-border/50">
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-muted/60 rounded text-xs">↑</kbd>
          <kbd className="px-1 py-0.5 bg-muted/60 rounded text-xs">↓</kbd>
          Navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-muted/60 rounded text-xs">⏎</kbd>
          Execute
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-muted/60 rounded text-xs">esc</kbd>
          Close
        </span>
      </div>
    </div>
  );
});
