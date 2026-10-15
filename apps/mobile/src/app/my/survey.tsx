import { router } from "expo-router";
import { ko } from "@/copy/ko";
import { SurveyScreen } from "@/features/my/survey-screen";
import { useMyPage } from "@/features/my/use-my";
import { useSendSurvey, useSurveyQuestions } from "@/features/my/use-survey";
import { useSession } from "@/lib/session";
import { useToast } from "@/ui";

// 마이 > 이용 설문. 지금 받을 차수는 마이 함수가 알려 준다
export default function Survey() {
  const session = useSession();
  const toast = useToast();
  const my = useMyPage(session?.user.id);
  const survey = my.data?.survey ?? undefined;
  const questions = useSurveyQuestions(survey?.round);
  const send = useSendSurvey(session?.user.id);
  if (!survey || !questions.data) return null;
  return (
    <SurveyScreen
      round={survey.round}
      questions={questions.data}
      onBack={() => router.back()}
      onSend={(scores, comment) =>
        send.mutate(
          { relationship: survey.relationship_id, round: survey.round, scores, comment },
          {
            onSuccess: () => {
              toast(ko.survey.sent);
              router.back();
            },
          },
        )
      }
    />
  );
}
