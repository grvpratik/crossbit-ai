import {type Message } from '@ai-sdk/react';
import { motion } from 'motion/react';
import { Clapperboard, ExternalLink, Loader, User, User2 } from 'lucide-react';
import {type ReactNode } from 'react';


import defaultAvatar from '@/assets/react.svg';
import TokenResearchUI from './tools/token-reasearch';

type MessageIconProps = {
  role: 'user' | 'assistant';
  isStreaming: boolean;
  avatarSrc?: string;
  userIcon?: ReactNode;
  assistantIcon?: ReactNode;
};

const MessageIcon = ({
  role,
  isStreaming,
  avatarSrc = defaultAvatar,
  userIcon,
  assistantIcon,
}: MessageIconProps) => {
  const baseIconClasses =
    'w-10 h-10 flex-shrink-0 flex items-center justify-center';

  if (role === 'user') {
    return (
      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
        {userIcon || <Clapperboard className="h-6 w-6" />}
      </div>
    );
  }

  return (
    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full text-white">
      {isStreaming ? (
        <Loader className="h-5 w-5 animate-pulse" />
      ) : (
        assistantIcon || (
          <img
            src={avatarSrc}
            className="h-5 w-5 rounded-full overflow-hidden"
            height={20}
            width={20}
            alt="Assistant avatar"
          />
        )
      )}
    </div>
  );
};

type MessageBubbleProps = {
  role: 'user' | 'assistant';
  content: string;
  messageId: string;
};

const MessageBubble = ({ role, content, messageId }: MessageBubbleProps) => {
  const roleSpecificClass =
    role === 'user'
      ? 'text-slate-900 font-semibold paragraph-md py-2 overflow-x-auto rounded-2xl'
      : 'text-blue-950 paragraph-md';

  return (
    <div className="whitespace-pre-wrap w-full">
      <div className={`prose max-w-fit ${roleSpecificClass}`}>
        {/* <MemoizedMarkdown id={messageId} content={content} /> */}
        {JSON.stringify(content,null,2)}
      </div>
    </div>
  );
};

type MessageContentProps = {
  message: Message;
  data:any;
  isStreaming: boolean;
  lastMessage: boolean;
  hasToolInvocations: boolean;
  onSourceClick?: () => void;
  avatarSrc?: string;
  userIcon?: ReactNode;
  assistantIcon?: ReactNode;

  sourceButtonText?: string;
};


export const MessageContent = ({
  message,
  data,
  isStreaming,
  lastMessage,
  hasToolInvocations,
  onSourceClick,
  avatarSrc,
  userIcon,
  assistantIcon,

  sourceButtonText = 'View Sources',
}: MessageContentProps) => {
  const parts = message.parts;
  lastMessage && console.log('MESSAGE SINGLE', message);
  console.log(
    message.annotations,
    message.content,
    message.experimental_attachments,
    message.parts,
    message.id,
  );
  const annotation = data;
  // switch (parts) {
  // 	case value:

  // 		break;

  // 	default:
  // 		break;
  // }

  return (
    <div className="flex flex-col">
      <motion.div
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-start gap-4"
      >
        {/* <MessageIcon
          role={message.role as 'user' | 'assistant'}
          isStreaming={isStreaming}
          avatarSrc={avatarSrc}
          userIcon={userIcon}
          assistantIcon={assistantIcon}
        /> */}

        <div className="flex-1 paragraph-md mx-auto overflow-hidden">
          {/* {JSON.stringify(annotation, null, 4)} */}

          {message &&
            'parts' in message &&
            message.parts?.map((part) => {
              switch (part.type) {
                case 'text':
                  return (
                    <MessageBubble
                    key={message.id}
                      role={message.role as 'user' | 'assistant'}
                      content={part.text}
                      messageId={message.id}
                    />
                  );
                case 'step-start':
                  return <div></div>;
                case 'tool-invocation':
                  // Extract relevant information from the part
                  const { state, args, toolCallId, toolName } =
                    part.toolInvocation;

                  // For token research tool specifically
                  if (toolName === 'tokenResearch') {
                    // When the tool is first called
                    if (state === 'call' && annotation?.length === 0) {
                      return (
                        <TokenResearchUI
                          toolCallId={toolCallId}
                          toolName={toolName}
                          mintAddress={args?.mint || ''}
                          isResearching={true}
                          steps={[]} // Initially empty
                          currentStep={null}
                          overallProgress={0}
                          completed={false}
                        />
                      );
                    }
                    if (state === 'call' && annotation?.length > 0) {
                      const progressAnnotation = annotation!
                        .filter((anno) => anno.type === 'research_progress')
                        .pop();

                      if (progressAnnotation) {
                        return (
                          <TokenResearchUI
                            toolCallId={toolCallId}
                            toolName={toolName}
                            mintAddress={args?.mint || ''}
                            isResearching={true}
                            steps={progressAnnotation.steps}
                            currentStep={progressAnnotation.currentStep}
                            overallProgress={progressAnnotation.overallProgress}
                            completed={progressAnnotation.completed || false}
                            summary={progressAnnotation.summary}
                          />
                        );
                      }
                    }
                    if (state === 'result') {
                      // Extract the final result data
                      const resultData = part.toolInvocation.result;

                      // Find the final annotation with the completed status if it exists
                      const finalAnnotation = annotation!
                        ?.filter(
                          (anno) =>
                            anno.type === 'research_progress' && anno.completed,
                        )
                        .pop();

                      return (
                        <TokenResearchUI
                          toolCallId={toolCallId}
                          toolName={toolName}
                          mintAddress={args?.mint || ''}
                          isResearching={false}
                          steps={finalAnnotation?.steps || []}
                          currentStep={null}
                          overallProgress={100}
                          completed={true}
                          summary={finalAnnotation?.summary || resultData?.data}
                        />
                      );
                    }
                  }
                  return <div>tool invo</div>;
                // const { state, args, toolCallId, toolName,step } =
                // 	part.toolInvocation;
                // 	if (toolName === "tokenResearch"&& state==='call'){
                // 		return <div></div>
                // 	}if (toolName === "tokenResearch" && state === "result") {
                // 		return <div></div>;
                // 	}
                // 		return (
                // 			<div>{`State: ${state}, Args: ${JSON.stringify(
                // 				args
                // 			)}, Tool ID: ${toolCallId}, Tool: ${toolName}, Step: ${step}`}</div>
                // 		);

                // switch (part.toolInvocation.state) {

                // 	case "partial-call":
                // 		return (
                // 			<div className=" p-3 rounded-lg bg-orange-400 my-2">
                // 				render partial tool call for{" "}
                // 				{part.toolInvocation.toolName}
                // 			</div>
                // 		);
                // 	case "call":
                // 		return (
                // 			<div className=" p-3 rounded-lg bg-blue-400 my-2">
                // 				{JSON.stringify(annotation, null, 4)}
                // 				render full tool call {part.toolInvocation.toolName}
                // 			</div>
                // 		);
                // 	case "result":
                // 		return (
                // 			<div className=" p-3 rounded-lg bg-green-400 my-2">
                // 				render tool result {part.toolInvocation.toolName}
                // 			</div>
                // 		);
                // }
                // break;

                default:
                  return null;
              }
            })}

          {/* {message.role === "assistant" &&
						hasToolInvocations &&
						onSourceClick && (
							<div className="mt-2">
								<Button
									variant="outline"
									size="sm"
									onClick={onSourceClick}
									className="text-xs flex items-center gap-1"
								>
									<ExternalLink className="h-3 w-3" />
									{sourceButtonText}
								</Button>
							</div>
						)}  */}

          {/* {!lastMessage && <Separator className="w-full my-3 rounded-xl" />} */}
        </div>
      </motion.div>
    </div>
  );
};

















// import { type Message } from '@ai-sdk/react';
// import { motion } from 'motion/react'; // Using framer-motion for animations
// import {
//   Clapperboard,
//   ExternalLink,
//   Loader,
//   Sparkles,
//   ArrowDown,
// } from 'lucide-react';
// import { type ReactNode, useRef, useEffect, useState } from 'react';

// import defaultAvatar from '@/assets/react.svg';
// import TokenResearchUI from './tools/token-reasearch';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Button } from '@/components/ui/button';

// import { cn } from '@/lib/utils'; // Utility for conditional class names

// // --- MessageIcon Component ---
// type MessageIconProps = {
//   role: 'user' | 'assistant';
//   isStreaming: boolean;
//   avatarSrc?: string;
//   userIcon?: ReactNode;
//   assistantIcon?: ReactNode;
// };

// const MessageIcon = ({
//   role,
//   isStreaming,
//   avatarSrc = defaultAvatar,
//   userIcon,
//   assistantIcon,
// }: MessageIconProps) => {
//   const iconClasses =
//     'w-10 h-10 flex-shrink-0 flex items-center justify-center';

//   if (role === 'user') {
//     return (
//       <div className={iconClasses}>
//         {userIcon || <Clapperboard className="h-6 w-6 text-blue-600" />}
//       </div>
//     );
//   }

//   return (
//     <div className={cn(iconClasses, 'rounded-full text-white')}>
//       {isStreaming ? (
//         <Loader className="h-5 w-5 animate-spin text-blue-400" />
//       ) : (
//         assistantIcon || (
//           <img
//             src={avatarSrc}
//             className="h-5 w-5 rounded-full overflow-hidden object-cover"
//             height={20}
//             width={20}
//             alt="Assistant avatar"
//           />
//         )
//       )}
//     </div>
//   );
// };

// // --- MessageContent Component ---
// type MessageContentProps = {
//   message: Message;
//   data: any; // Consider a more specific type for data if possible
//   isStreaming: boolean;
//   lastMessage: boolean;
//   hasToolInvocations: boolean;
//   onSourceClick?: (message: Message) => void;
//   avatarSrc?: string;
//   userIcon?: ReactNode;
//   assistantIcon?: ReactNode;
//   sourceButtonText?: string;
// };

// export const MessageContent = ({
//   message,
//   data,
//   isStreaming,
//   lastMessage,
//   hasToolInvocations,
//   onSourceClick,
//   avatarSrc,
//   userIcon,
//   assistantIcon,
//   sourceButtonText = 'View Sources',
// }: MessageContentProps) => {
//   const annotation = data;

//   const roleSpecificTextClasses =
//     message.role === 'user' ? 'text-slate-900 font-medium' : 'text-gray-800';

//   return (
//     <motion.div
//       initial={{ y: 5, opacity: 0 }}
//       animate={{ y: 0, opacity: 1 }}
//       transition={{ duration: 0.2 }}
//       className="flex items-start gap-3 sm:gap-4"
//     >
//       <MessageIcon
//         role={message.role as 'user' | 'assistant'}
//         isStreaming={isStreaming}
//         avatarSrc={avatarSrc}
//         userIcon={userIcon}
//         assistantIcon={assistantIcon}
//       />

//       <div
//         className={cn(
//           'flex-1 p-3 rounded-lg text-sm md:text-base',
//           message.role === 'user'
//             ? 'bg-blue-100 text-blue-900'
//             : 'bg-gray-100 text-gray-800',
//         )}
//       >
//         <div className={cn('prose max-w-none', roleSpecificTextClasses)}>
//           {message.parts?.map((part, index) => {
//             switch (part.type) {
//               case 'text':
//                 return (
//                   <p key={index} className="whitespace-pre-wrap">
//                     {part.text}
//                   </p>
//                 );
//               case 'tool-invocation':
//                 const { state, args, toolCallId, toolName, result } =
//                   part.toolInvocation;

//                 // Handle 'tokenResearch' tool specifically
//                 if (toolName === 'tokenResearch') {
//                   // When the tool is first called and no progress annotation exists
//                   if (
//                     state === 'call' &&
//                     (!annotation || annotation.length === 0)
//                   ) {
//                     return (
//                       <TokenResearchUI
//                         key={toolCallId}
//                         toolCallId={toolCallId}
//                         toolName={toolName}
//                         mintAddress={args?.mint || ''}
//                         isResearching={true}
//                         steps={[]} // Initially empty
//                         currentStep={null}
//                         overallProgress={0}
//                         completed={false}
//                       />
//                     );
//                   }
//                   // When tool is called and progress annotations are available
//                   if (state === 'call' && annotation && annotation.length > 0) {
//                     const progressAnnotation = annotation
//                       .filter((anno: any) => anno.type === 'research_progress')
//                       .pop();

//                     if (progressAnnotation) {
//                       return (
//                         <TokenResearchUI
//                           key={toolCallId}
//                           toolCallId={toolCallId}
//                           toolName={toolName}
//                           mintAddress={args?.mint || ''}
//                           isResearching={true}
//                           steps={progressAnnotation.steps}
//                           currentStep={progressAnnotation.currentStep}
//                           overallProgress={progressAnnotation.overallProgress}
//                           completed={progressAnnotation.completed || false}
//                           summary={progressAnnotation.summary}
//                         />
//                       );
//                     }
//                   }
//                   // When tool has completed
//                   if (state === 'result') {
//                     const finalAnnotation = annotation
//                       ?.filter(
//                         (anno: any) =>
//                           anno.type === 'research_progress' && anno.completed,
//                       )
//                       .pop();

//                     return (
//                       <TokenResearchUI
//                         key={toolCallId}
//                         toolCallId={toolCallId}
//                         toolName={toolName}
//                         mintAddress={args?.mint || ''}
//                         isResearching={false}
//                         steps={finalAnnotation?.steps || []}
//                         currentStep={null}
//                         overallProgress={100}
//                         completed={true}
//                         summary={finalAnnotation?.summary || result?.data}
//                       />
//                     );
//                   }
//                 }
//                 return null; // Don't render other tool invocations by default
//               default:
//                 return null;
//             }
//           })}
//         </div>

//         {message.role === 'assistant' &&
//           hasToolInvocations &&
//           onSourceClick && (
//             <div className="mt-2 flex justify-end">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => onSourceClick(message)}
//                 className="text-xs flex items-center gap-1 text-gray-600 hover:text-gray-800"
//               >
//                 <ExternalLink className="h-3 w-3" />
//                 {sourceButtonText}
//               </Button>
//             </div>
//           )}
//       </div>
//     </motion.div>
//   );
// };

