import { UIMessage } from 'ai';
import { useCallback, useState } from 'react';

import config from '@ui/config';
import { SlashCommand, getSlashCommandSuggestions, parseSlashCommand } from '@ui/lib/utils/slash-commands';
import { useChatStore } from '@ui/stores';

interface UseSlashCommandsProps {
  messages: UIMessage[];
  setMessages: (messages: UIMessage[]) => void;
  sendMessage: (message: { text: string }) => void;
  currentChat?: { id: number } | null;
  clearDraftMessage: (chatId: number) => void;
  updateMessages: (chatId: number, messages: UIMessage[]) => void;
  setIsSubmitting?: (b: boolean) => void;
  onShowHelp?: () => void;
  onShowModels?: () => void;
  onShowTools?: () => void;
  onRetryLastMessage?: () => void;
}

export function useSlashCommands({
  messages,
  setMessages,
  sendMessage,
  currentChat,
  clearDraftMessage,
  updateMessages,
  setIsSubmitting,
  onShowHelp,
  onShowModels,
  onShowTools,
  onRetryLastMessage,
}: UseSlashCommandsProps) {
  const [isSuggestionDropdownVisible, setIsSuggestionDropdownVisible] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(0);
  const [textInputBoundingRect, setTextInputBoundingRect] = useState<DOMRect | undefined>();
  const chatStore = useChatStore();

  // 1. Input validation utilities - First level: Basic input checking
  const checkIfInputStartsWithSlash = useCallback((input: string) => {
    const parseResult = parseSlashCommand(input);
    return parseResult.isSlashCommand;
  }, []);

  const validateSlashCommandSyntax = useCallback((input: string) => {
    const parseResult = parseSlashCommand(input);
    return parseResult.isValidCommand;
  }, []);

  // 2. Suggestion dropdown management - Second level: UI state management
  const refreshSuggestionDropdownBasedOnInput = useCallback((input: string, textareaElement?: HTMLTextAreaElement) => {
    const suggestions = getSlashCommandSuggestions(input);

    if (suggestions.length > 0) {
      setIsSuggestionDropdownVisible(true);
      setHighlightedSuggestionIndex(0);

      if (textareaElement) {
        const rect = textareaElement.getBoundingClientRect();
        setTextInputBoundingRect(rect);
      }
    } else {
      setIsSuggestionDropdownVisible(false);
    }

    return suggestions;
  }, []);

  const getSlashCommandFromSuggestionAtIndex = useCallback(
    (index: number, suggestions: Array<{ command: SlashCommand; description: string }>) => {
      if (index >= 0 && index < suggestions.length) {
        return suggestions[index].command;
      }
      return null;
    },
    []
  );

  const moveHighlightThroughSuggestionsList = useCallback((direction: 'up' | 'down', maxIndex: number) => {
    setHighlightedSuggestionIndex((prev) => {
      if (direction === 'down') {
        return prev < maxIndex - 1 ? prev + 1 : 0;
      } else {
        return prev > 0 ? prev - 1 : maxIndex - 1;
      }
    });
  }, []);

  const closeSuggestionDropdownAndResetState = useCallback(() => {
    setIsSuggestionDropdownVisible(false);
    setHighlightedSuggestionIndex(0);
    setTextInputBoundingRect(undefined);
  }, []);

  // 3. Command execution utilities - Third level: Actual business logic
  const executeDeleteCurrentChatAndCreateNew = useCallback(async () => {
    if (!currentChat) return;

    // Use the exact same logic as deleteCurrentChat from chat-store
    // This will delete the current chat and create a new one
    await chatStore.deleteCurrentChat();
  }, [currentChat, chatStore]);

  const generateConversationSummaryAndSend = useCallback(() => {
    if (!currentChat) return;
    const systemMemoriesId = config.chat.systemMemoriesMessageId;
    const hasConversation = messages.some((m) => m.id !== systemMemoriesId);
    if (!hasConversation) {
      console.error('[SlashCommands] /compact ignored: no conversation to summarize');
      return;
    }
    const conversationText = messages
      .map((msg) => {
        const content = msg.parts?.find((p) => p.type === 'text')?.text || '';
        return `${msg.role}: ${content}`;
      })
      .join('\n');

    const summarizationPrompt = `Summarize the existing conversation above. Provide a concise context summary we can continue from. Do not repeat all messages.\n\n---\n${conversationText}`;
    setIsSubmitting?.(true);
    sendMessage({ text: summarizationPrompt });
    clearDraftMessage(currentChat.id);
  }, [currentChat, messages, sendMessage, clearDraftMessage, setIsSubmitting]);

  // 4. Command routing and execution - Fourth level: Command dispatcher
  const executeSlashCommandAction = useCallback(
    (command: SlashCommand) => {
      switch (command) {
        case SlashCommand.CLEAR:
          void executeDeleteCurrentChatAndCreateNew();
          break;
        case SlashCommand.COMPACT:
          generateConversationSummaryAndSend();
          break;
        case SlashCommand.HELP:
          onShowHelp?.();
          break;
        case SlashCommand.RETRY:
          onRetryLastMessage?.();
          break;
        case SlashCommand.MODELS:
          onShowModels?.();
          break;
        case SlashCommand.TOOLS:
          onShowTools?.();
          break;
        default:
          console.warn('Unknown slash command:', command);
      }
    },
    [
      executeDeleteCurrentChatAndCreateNew,
      generateConversationSummaryAndSend,
      onShowHelp,
      onRetryLastMessage,
      onShowModels,
      onShowTools,
    ]
  );

  // 5. Main entry point - Fifth level: Public API
  const parseAndExecuteSlashCommandFromInput = useCallback(
    (input: string): boolean => {
      const parseResult = parseSlashCommand(input);

      if (parseResult.isSlashCommand && parseResult.isValidCommand && parseResult.command) {
        executeSlashCommandAction(parseResult.command);
        return true;
      }

      return false;
    },
    [executeSlashCommandAction]
  );

  return {
    isSuggestionDropdownVisible,
    highlightedSuggestionIndex,
    textInputBoundingRect,
    parseAndExecuteSlashCommandFromInput,
    refreshSuggestionDropdownBasedOnInput,
    getSlashCommandFromSuggestionAtIndex,
    moveHighlightThroughSuggestionsList,
    closeSuggestionDropdownAndResetState,
    checkIfInputStartsWithSlash,
    validateSlashCommandSyntax,
    executeDeleteCurrentChatAndCreateNew,
    generateConversationSummaryAndSend,
  };
}
