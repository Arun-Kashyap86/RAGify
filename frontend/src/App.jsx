function waitForConversationTitle(conversationId) {
    const interval = setInterval(async () => {
        try {
            const data = await getConversation(conversationId);
            const updatedConversation = data.conversation;

            if (updatedConversation.title !== "New Chat") {
                clearInterval(interval);

                setActiveConversation((current) => ({
                    ...current,
                    title: updatedConversation.title
                }));

                setConversations((current) =>
                    current.map((conversation) =>
                        conversation.id === conversationId
                            ? {
                                ...conversation,
                                title: updatedConversation.title
                            }
                            : conversation
                    )
                );
            }
        } catch (error) {
            clearInterval(interval);
        }
    }, 100);
}