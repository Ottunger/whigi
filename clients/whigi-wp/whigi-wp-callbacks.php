<?php

//Start a PHP session
session_start();

define('HTTP_UTIL', get_option('whigi_http_util'));
define('CLIENT_ID', get_option('whigi_whigi_id'));
define('CLIENT_SECRET', get_option('whigi_whigi_secret'));
define('REDIRECT_URI', rtrim(site_url(), '/') . '/');
define('URL_REG', "https://whigi.envict.com/account/" . urlencode(CLIENT_ID) . '/');
define('URL_LOG', "https://whigi.envict.com/remote/" . urlencode(CLIENT_ID) . '/');

//Last URL
if(!$_SESSION['WHIGI']['LAST_URL']) {
	$_SESSION['WHIGI']['LAST_URL'] = strtok($_SERVER['HTTP_REFERER'], "?");
}

if(!CLIENT_ID || !CLIENT_SECRET) {
	$this->whigi_end_login("The third-party authentication provider has not been configured with an API id/secret. Please notify the admin or try again later.");
} elseif(isset($_GET['whigi-connect'])) {
	//Post-auth phase, verify went OK
	if($_GET['whigi-connect'] == 'ok' && isset($_GET['user']) && isset($_GET['response']) && $_GET['response'] != 'null') {
		//Check that $_SESSION['WHIGI']['STATE'] is decrypt(reponse) and build identity
		$url = "https://" . get_option('whigi_whigi_id') . ":" . hash('sha256', get_option('whigi_whigi_secret')) . "@whigi.envict.com/profile/data";
		switch(strtolower(HTTP_UTIL)) {
			case 'curl':
				$curl = curl_init();
				curl_setopt($curl, CURLOPT_URL, $url);
				curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
				curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, (get_option('whigi_http_util_verify_ssl') == 1 ? 1 : 0));
				curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, (get_option('whigi_http_util_verify_ssl') == 1 ? 2 : 0));
				$result = curl_exec($curl);
				break;
			case 'stream-context':
				$opts = array('http' =>
					array(
						'method'  => 'GET'
					)
				);
				$context = stream_context_create($opts);
				$result = @file_get_contents($url, false, $context);
				break;
		}
		//Parse the JSON response
		$result_obj = json_decode($result, true);
		WHIGI::$shared_with_me = $result_obj['shared_with_me'];
		if(isset($result_obj['shared_with_me']) && isset($result_obj['shared_with_me'][$_GET['user']]) &&
			isset($result_obj['shared_with_me'][$_GET['user']]['keys/auth/' . CLIENT_ID])) {
			//Retrieve vault
			$url = "https://" . get_option('whigi_whigi_id') . ":" . hash('sha256', get_option('whigi_whigi_secret')) . "@whigi.envict.com/vault/" . $result_obj['shared_with_me'][$_GET['user']]['keys/auth/' . CLIENT_ID];
			switch(strtolower(HTTP_UTIL)) {
				case 'curl':
					$curl = curl_init();
					curl_setopt($curl, CURLOPT_URL, $url);
					curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
					curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, (get_option('whigi_http_util_verify_ssl') == 1 ? 1 : 0));
					curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, (get_option('whigi_http_util_verify_ssl') == 1 ? 2 : 0));
					$result = curl_exec($curl);
					break;
				case 'stream-context':
					$opts = array('http' =>
						array(
							'method'  => 'GET'
						)
					);
					$context = stream_context_create($opts);
					$result = @file_get_contents($url, false, $context);
					break;
			}
			//Parse the JSON response
			$result_obj = json_decode($result, true);
			if(isset($result_obj['data_crypted_aes']) && isset($result_obj['aes_crypted_shared_pub'])) {
				openssl_private_decrypt($result_obj['aes_crypted_shared_pub'], $aes_key, $_SESSION['WHIGI']['RSA_PRI_KEY']);
				$decr_response = mcrypt_decrypt('aes-256-ctr', $aes_key, $result_obj['data_crypted_aes']);
				if($decr_response == $_SESSION['WHIGI']['STATE']) {
					$this->whigi_login_user(array(
						"_id" => $_GET['user']
					));
				} else {
					//Cannot log in.
					$this->whigi_end_login("Sorry, we couldn't log you in. Please notify the admin or try again later.");
				}
			} else {
				//Cannot log in.
				$this->whigi_end_login("Sorry, we couldn't log you in. Please notify the admin or try again later.");
			}
		} else {
			//Cannot log in.
			$this->whigi_end_login("Sorry, we couldn't log you in. Please notify the admin or try again later.");
		} 
	} else {
		//Cannot log in.
		$this->whigi_end_login("Sorry, we couldn't log you in. Please notify the admin or try again later.");
	}
} elseif(isset($_GET['whigi-grant'])) {
	if($_GET['whigi-grant'] == 'bad') {
		$_SESSION['WHIGI']['IGNORE_GRANT'] = true;	
	}
	$url = $_SESSION['WHIGI']['LAST_URL'];
	unset($_SESSION['WHIGI']['LAST_URL']);
	header("Location: $url");
	exit;
} else {
	//Pre-auth phase, start the login (the verb _GET['connect'] is set, but we do not use it)
	$this->whigi_clear_login_state();
	$_SESSION['WHIGI']['STATE'] = $challenge;
	$challenge = uniqid('', true);
	$urlp2 = URL_LOG . $challenge . urlencode(REDIRECT_URI . '?connect=ok');
	$url = URL_REG . urlencode($urlp2) . '/' . urlencode(REDIRECT_URI . '?connect=bad');
	header("Location: $url");
	exit;
}

?>