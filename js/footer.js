

// Add click event listeners to option elements
document.addEventListener("DOMContentLoaded", function () {
  const optionElements = document.querySelectorAll(".option");
  optionElements.forEach(function (element) {
    element.addEventListener("click", function () {
      console.log("Option clicked");
    });
  });
});

function treasurepopremove() {
  const model = document.getElementById("treasure-popup");
  const popup = document.querySelector(".usr_reward");
  model.classList.remove("show");
  popup.classList.remove("show");
  setTimeout(() => {
    model.classList.add("hidden");
  }, 300);
}

function treasureopen() {
  const model = document.getElementById("treasure-popup");
  const popup = document.querySelector(".usr_reward");
  model.classList.remove("hidden");
  setTimeout(() => {
    model.classList.add("show");
    popup.classList.add("show");
  }, 50);
}

function closereward() {
  location.href = "/playquiz.html";
}

function showToast(e) {
  const toast = document.createElement("div");
  toast.className =
    "max-w-xs border border-gray-200 p-4 rounded shadow-lg flex items-center space-x-4";
  toast.innerHTML = `
        <div class="flex-shrink-0" style="z-index: 1111111 !important;">

          <svg class="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7 12l5 5L21 7" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-semibold">${e.title}</p>
          <p class="text-sm">${e.msg}</p>
        </div>
      `;
  document.getElementById("toast-container").appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function RewardAdforpopup() {
  googletag.cmd.push(function () {
    try {
      if (
        !googletag.enums.OutOfPageFormat ||
        !googletag.enums.OutOfPageFormat.REWARDED
      ) {
        console.error("Rewarded ad format not supported");
        showToast({
          title: "Error",
          msg: "Rewarded ads not supported on this device.",
        });
        return;
      }

      const rewardedSlot = googletag
        .defineOutOfPageSlot(
          "/23353868385/gamtreasure.com_d1",
          googletag.enums.OutOfPageFormat.REWARDED
        )
        .addService(googletag.pubads());

      if (!rewardedSlot) {
        console.error("Failed to create finance rewarded ad slot");
        showToast({ title: "Error", msg: "Failed to create reward ad." });
        return;
      }

      googletag.display(rewardedSlot);
      console.log("Attempting to display finance rewarded ad...");

      const timeoutId = setTimeout(() => {
        console.log("Finance rewarded ad timeout");
        showToast({
          title: "Timeout",
          msg: "Ad took too long to load. Please try again.",
        });
        closereward();
        googletag.destroySlots([rewardedSlot]);
      }, 10000);

      googletag.pubads().addEventListener("rewardedSlotReady", function (evt) {
        console.log("Finance rewarded ad ready.");
        clearTimeout(timeoutId);
        evt.makeRewardedVisible();
        treasurepopremove();
      });

      googletag.pubads().addEventListener("rewardedSlotClosed", function () {
        console.log("Finance rewarded ad closed.");
        clearTimeout(timeoutId);
        googletag.destroySlots([rewardedSlot]);
        showToast({
          title: "Reward Earned!",
          msg: "100 coins added to your account!",
        });
        closereward();
      });

      googletag.pubads().addEventListener("rewardedSlotGranted", function () {
        console.log("Finance reward granted.");
        showToast({
          title: "Success!",
          msg: "Reward will be credited shortly.",
        });
        closereward();
      });
    } catch (error) {
      console.error("Error during finance rewarded ad setup:", error);
      showToast({
        title: "Error",
        msg: "Failed to load rewarded ad: " + error.message,
      });
      closereward();
    }
  });
}
