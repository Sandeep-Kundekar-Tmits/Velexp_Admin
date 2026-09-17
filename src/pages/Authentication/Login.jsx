import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Link, useLocation, useNavigate } from "react-router-dom";
import withRouter from "../../components/Common/withRouter";
import AmbientBackground from "../../components/Common/AmbientBackground";

import {
  Input,
  FormFeedback,
  Label,
} from "@/components/ui";
// import images
import CompanyLogo from "../../assets/images/vellocity-express-logo.png";
import { useState } from "react";
import usePostApiCall from "../../hooks/usePostApiCall";
import { LOGIN_API_URL } from "../../api";
import { resolveMenuAccess } from "../../helpers/checkMenuAccess";
import { useAuthStore } from "@/stores/authStore";
import { ClipLoader } from "react-spinners"
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useMotionTemplate,
} from "framer-motion";
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, User } from "lucide-react";
import { cn } from "@/lib/cn";

/* Auth surface only. The palette lives in arbitrary values rather than in the
   global @theme block because the rest of the admin is the light "Dense Ops"
   theme -- promoting these to tokens would let the dark scheme leak into every
   report screen. */
const EASE = [0.22, 1, 0.36, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

/* The `invalid` prop on <Input> already sets a red border, but this component's
   className is merged last and would otherwise win. Deriving both states here
   keeps the primitive's validation contract intact. */
const fieldClasses = (hasError) =>
  cn(
    "h-12 w-full rounded-xl border bg-white/[0.04] pl-11 pr-4 text-[14px] text-white",
    "placeholder:text-[#94A3B8]/60 transition-[border-color,box-shadow,background-color] duration-200",
    "focus:bg-white/[0.06] focus:outline-none focus:ring-4",
    /* Picking a saved value makes Chrome paint its own near-white fill via the
       UA stylesheet, which is flagged !important -- no background-color rule
       can beat it. Clipping that fill to the glyphs makes it invisible while
       leaving the field's own background showing, and unlike the usual
       "1000px inset box-shadow" trick it does not fight the focus ring, which
       is itself a box-shadow. text-fill-color restores the white text. */
    "autofill:[-webkit-background-clip:text] autofill:[-webkit-text-fill-color:#FFFFFF]",
    "autofill:caret-white",
    hasError
      ? "border-[#EF4444]/70 focus:border-[#EF4444] focus:ring-[#EF4444]/20"
      : "border-white/8 hover:border-white/[0.16] focus:border-[#3B82F6] focus:ring-[#3B82F6]/20"
  );

const Login = (props) => {
  const { apifunc: login, data, error: apiError, loading } = usePostApiCall()
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((s) => s.setSession)
  const [loginInfo, setLoginInfo] = useState({
    username: "",
    password: ""
  })

  const [error, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const onInputChnage = (e) => {
    const { value, name } = e.target

    setLoginInfo({
      ...loginInfo,
      [name]: value
    })
  }
  useEffect(() => {
    //meta title
    document.title = "Velexp Admin Login";
  }, []);

  const onSubmitForm = async () => {
    const newError = {};

    if (!loginInfo.username) {
      newError.username = "User name is required";
    }

    if (!loginInfo.password) {
      newError.password = "Password is required";
    }

    setErrors(newError);

    if (Object.keys(newError).length === 0) {
      // Submit the form logic here
      console.log("Form submitted", loginInfo);
      // api call
      let userData = await login(LOGIN_API_URL, loginInfo)

      if (userData?.status === "success") {
        // Non-admin, non-staff accounts don't get an admin-panel session.
        if (userData?.user?.is_staff === false && !userData?.user?.is_admin) {
          // Previously navigated to "/login" (already here) with no message,
          // so the form just sat there and looked broken.
          setErrors({ error: "This account does not have admin panel access." });
          return
        }

        // Writes through to localStorage["authUser"] in the same shape as
        // before, so tokenRefresh/checkMenuAccess/ProfileMenu keep working.
        setSession(userData);

        // Route based on privileges, not customer type -- admin always
        // lands on /user-list, staff lands on the first screen their
        // privileges actually grant. If the guard bounced them here from a
        // protected page, honour that destination instead.
        const { defaultRoute } = resolveMenuAccess(userData?.user, userData?.privileges);
        const intended = location.state?.from?.pathname;
        navigate(intended || defaultRoute, { replace: true });
      }

    }
  };

  // Enter in either field submits like a normal form. The fields sit in a
  // real <form> now specifically so this works without a keydown handler
  // on each input -- native submit-on-Enter, guarded against a second
  // submit firing while the first is still in flight.
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading) onSubmitForm();
  };

  const reduceMotion = useReducedMotion();

  // Card-local coordinates, unsprung so the sheen tracks the cursor exactly
  // while it is over the glass. The screen-wide spotlight now lives inside
  // <AmbientBackground /> along with the rest of the backdrop.
  const cardX = useMotionValue(0);
  const cardY = useMotionValue(0);
  const cardSheenX = useMotionTemplate`${cardX}px`;
  const cardSheenY = useMotionTemplate`${cardY}px`;

  const onCardPointerMove = (event) => {
    if (reduceMotion) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    cardX.set(event.clientX - bounds.left);
    cardY.set(event.clientY - bounds.top);
  };

  // `setErrors({ error })` above is the account-without-admin-access case; it
  // shares the banner with the API error so the message is actually surfaced.
  const bannerMessage = apiError?.error || error?.error;

  // useEffect(() => {
  //   if (data && data?.status) {
  //     // Successful login
  //     navigate("/user-list");
  //   }
  // }, [data])
  return (
    <React.Fragment>
      {/* h-dvh, not h-screen: on mobile browsers 100vh excludes the collapsing
          URL bar, which is what makes auth pages scroll by a few pixels. */}
      <div className="relative h-dvh w-full overflow-hidden bg-[#050816] antialiased">
        <AmbientBackground />

        <div className="relative z-10 flex h-full items-center justify-center px-4 py-6 sm:px-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="w-full max-w-[460px]"
          >
            <motion.div
              variants={itemVariants}
              onPointerMove={onCardPointerMove}
              className="group relative rounded-3xl border border-white/8 bg-[rgba(17,24,39,0.70)] p-6 shadow-[0_24px_70px_-20px_rgba(2,6,23,0.9)] backdrop-blur-xl sm:p-8"
            >
              {/* Sheen across the glass. Fades in on hover via Tailwind so no
                  extra React state is needed to know the pointer left. */}
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(160px_circle_at_var(--sheen-x)_var(--sheen-y),rgba(255,255,255,0.07),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ "--sheen-x": cardSheenX, "--sheen-y": cardSheenY }}
              />
              <div className="relative auth-logo">
                <Link
                  to="/"
                  className="auth-logo-dark mx-auto flex w-fit rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#38BDF8]"
                >
                  {/* White plate, not glass: the artwork is a blue mark above a
                      black tagline, and both disappear against the dark card. */}
                  <motion.span
                    variants={itemVariants}
                    className="relative flex items-center justify-center   px-6 "
                  >
                    <img
                      src={CompanyLogo}
                      alt="Velocity Express"
                       className="h-16 w-auto sm:h-30
           "
                      
                    />
                  </motion.span>
                </Link>
              </div>

              <motion.div variants={itemVariants} className=" text-center">
                {/* <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[24px]">
                  Welcome Back !
                </h1> */}
                <p className="mt-2 text-[14px] text-[#94A3B8]">Sign up to Admin Panel.</p>
              </motion.div>

              <div className="mt-6">
                <form className="form-horizontal" onSubmit={handleSubmit}>
                  <motion.div variants={itemVariants} className="mb-4">
                    <Label for="username" className="mb-2 text-[13px] font-medium text-[#94A3B8]">
                      User
                    </Label>
                    <div className="relative">
                      <User
                        aria-hidden="true"
                        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]"
                      />
                      <Input
                        id="username"
                        name="username"
                        className={fieldClasses(!!error?.username)}
                        placeholder="Enter User"
                        type="text"
                        value={loginInfo.username}
                        invalid={!!error?.username}
                        onChange={onInputChnage}
                        aria-invalid={!!error?.username}
                        aria-describedby={error?.username ? "username-error" : undefined}
                      />
                    </div>
                    <AnimatePresence initial={false}>
                      {error?.username && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.2, ease: EASE }}
                        >
                          <FormFeedback
                            id="username-error"
                            type="invalid"
                            className="mt-2 flex items-center gap-1.5 text-[12px] text-[#EF4444]"
                          >
                            <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
                            {error?.username}
                          </FormFeedback>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <motion.div variants={itemVariants} className="mb-4">
                    <Label for="password" className="mb-2 text-[13px] font-medium text-[#94A3B8]">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock
                        aria-hidden="true"
                        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]"
                      />
                      <Input
                        id="password"
                        name="password"
                        autoComplete="off"
                        type={showPassword ? "text" : "password"}
                        className={cn(fieldClasses(!!error?.password), "pr-11")}
                        placeholder="Enter Password"
                        value={loginInfo.password}
                        invalid={!!error?.password}
                        onChange={onInputChnage}
                        aria-invalid={!!error?.password}
                        aria-describedby={error?.password ? "password-error" : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] transition-colors duration-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
                      </button>
                    </div>
                    <AnimatePresence initial={false}>
                      {error?.password && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.2, ease: EASE }}
                        >
                          <FormFeedback
                            id="password-error"
                            type="invalid"
                            className="mt-2 flex items-center gap-1.5 text-[12px] text-[#EF4444]"
                          >
                            <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
                            {error?.password}
                          </FormFeedback>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <motion.div variants={itemVariants} className="mt-6 grid">
                    <motion.button
                      className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#3B82F6] to-[#8B5CF6] text-[14px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(59,130,246,0.7)] transition-shadow duration-200 hover:shadow-[0_16px_40px_-10px_rgba(139,92,246,0.8)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8] disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none"
                      type="submit"
                      disabled={loading}
                      aria-busy={loading}
                      whileHover={reduceMotion || loading ? undefined : { scale: 1.01 }}
                      whileTap={reduceMotion || loading ? undefined : { scale: 0.99 }}
                      transition={{ duration: 0.2, ease: EASE }}
                    >
                      {
                        loading ? <ClipLoader size={22} color="#ffffff" /> : (
                          <React.Fragment>
                            Log In
                            <ArrowRight
                              aria-hidden="true"
                              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                            />
                          </React.Fragment>
                        )
                      }
                    </motion.button>
                    <AnimatePresence initial={false}>
                      {
                        bannerMessage && <motion.div
                          role="alert"
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.25, ease: EASE }}
                          className="mt-4 flex items-start gap-2 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-left text-[13px] font-medium text-[#FCA5A5]"
                        >
                          <AlertCircle aria-hidden="true" className="mt-px size-4 shrink-0" />
                          <span>{bannerMessage}</span>
                        </motion.div>
                      }
                    </AnimatePresence>
                  </motion.div>
                </form>
              </div>
              {/* <Link to="/forgot-password" className="mt-6 block text-center text-[13px] text-[#94A3B8] transition-colors duration-200 hover:text-[#38BDF8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"> Forgot password</Link> */}
            </motion.div>

            {/* <motion.div variants={itemVariants} className="mt-6 flex flex-col items-center gap-3">
              <p className="text-[12px] text-[#94A3B8]/70">Admin Panel</p>
            </motion.div> */}
          </motion.div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default withRouter(Login);

Login.propTypes = {
  history: PropTypes.object,
};
